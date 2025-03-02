from whynotyet.explanation import *
from whynotyet.dataset import *
from typing import Any
from ortools.math_opt.python import mathopt

EPS = 1e-5

def dominates(s, r):
    '''Returns True if s dominates r -- assumes s and r are numeric arrays of same length'''
    dominates = False
    for s_value, r_value in zip(s, r):
        if s_value < r_value:
            return False
        if s_value > r_value:
            dominates = True # must be also strictly greater in at least one attribute
    return dominates

class Explainer():
    def __init__(self, dataset: Dataset):
        self.dataset = dataset
        
    def get_M(self):
        if not self.attributes:
            raise Exception('data must be loaded into Dataset object')
        pass
        
    def explain(self, tuple_index: int, k: int, explanation_type: ExplanationType, weight_constraints: WeightConstraints, user_weight_constraints: list[UserWeightConstraint] | None) -> bool | int | Point | Box:
        rows = self.dataset.rows
        r = rows[tuple_index]

        dominators, dominatees = [], []
        for s_index, s in enumerate(self.dataset.rows):
            if s_index != tuple_index:
                if dominates([s[i] for i in self.dataset.numeric_indices], [r[i] for i in self.dataset.numeric_indices]):
                    dominators.append(s_index)
                elif dominates([r[i] for i in self.dataset.numeric_indices], [s[i] for i in self.dataset.numeric_indices]):
                    dominatees.append(s_index)
                
        model = mathopt.Model()
        tuple_indicators = {i: model.add_integer_variable(lb=0, ub=1, name=f"{i}_is_better") for i in range(len(rows)) if i != tuple_index and i not in dominators and i not in dominatees}
        
        #TODO choose M to be smaller (but sufficiently large as required)
        M = 1e9

        if explanation_type == ExplanationType.BOX:
            h = {attr: model.add_variable(lb=0, ub=1, name=f"h_{attr}") for attr in self.dataset.numeric_attributes}
            l = {attr: model.add_variable(lb=0, ub=1, name=f"l_{attr}") for attr in self.dataset.numeric_attributes}
            # First constraint in (7)
            for attr in self.dataset.numeric_attributes:
                model.add_linear_constraint(l[attr] <= h[attr])
            if weight_constraints == WeightConstraints.TRIANGLE:
                model.add_linear_constraint(sum(h_attr for h_attr in h.values()) == 1)
            elif weight_constraints == WeightConstraints.CUBE:
                # We already assume weights are at most 1, just need to make sure their sum is at least eps (for eps > 0)
                model.add_linear_constraint(sum(h_attr for h_attr in h.values()) >= EPS)
            
            for user_weight_constraint in user_weight_constraints or []:
                model.add_linear_constraint(l[user_weight_constraint.attribute] >= user_weight_constraint.lower_bound)
                model.add_linear_constraint(h[user_weight_constraint.attribute] <= user_weight_constraint.upper_bound)
            
            # Indicators using monotonic core
            for s_index, s in enumerate(self.dataset.rows):
                if s_index != tuple_index and s_index not in dominators and s_index not in dominatees:
                    # Find monotonic core
                    c = {attr: h[attr] if rows[s_index][i] >= r[i] else l[attr] for i, attr in zip(self.dataset.numeric_indices, self.dataset.numeric_attributes)}
                    model.add_linear_constraint(0 <= sum((r[i] - s[i]) * c[attr] for i, attr in zip(self.dataset.numeric_indices, self.dataset.numeric_attributes)) + M * (1 - tuple_indicators[s_index]))
    
            # Objectives
            if tuple_indicators: # constant <= constant not supported by ortools, so we need to stop if tuple_indicators is empty (e.g. when all others are dominators/dominatees)
                model.add_linear_constraint(sum(tuple_indicator for tuple_indicator in tuple_indicators.values()) + len(dominatees) >= len(self.dataset.rows) - k)
            model.maximize(sum(h[attr] - l[attr] for attr in self.dataset.numeric_attributes))
            
        elif explanation_type in (ExplanationType.SAT, ExplanationType.POINT, ExplanationType.BEST):
            weights = {attr: model.add_variable(lb=0, ub=1, name=f"weight_{attr}") for attr in self.dataset.numeric_attributes}
            if weight_constraints == WeightConstraints.TRIANGLE:
                model.add_linear_constraint(sum(weight for weight in weights.values()) == 1)
            elif weight_constraints == WeightConstraints.CUBE:
                # We already assume weights are at most 1, just need to make sure their sum is at least eps (for eps > 0)
                model.add_linear_constraint(sum(weight for weight in weights.values()) >= EPS)
            
            for user_weight_constraint in user_weight_constraints or []:
                model.add_linear_constraint(weights[user_weight_constraint.attribute] >= user_weight_constraint.lower_bound)
                model.add_linear_constraint(weights[user_weight_constraint.attribute] <= user_weight_constraint.upper_bound)
            
            # Indicators
            for s_index, s in enumerate(self.dataset.rows):
                if s_index != tuple_index and s_index not in dominators and s_index not in dominatees:
                    # First constraint in (3) in the paper
                    model.add_linear_constraint(0 <= sum((r[i] - s[i]) * weights[attr] for i, attr in zip(self.dataset.numeric_indices, self.dataset.numeric_attributes)) + M * (tuple_indicators[s_index]))
        
            # Objectives
            if explanation_type != ExplanationType.BEST and tuple_indicators: # constant <= constant not supported by ortools, so we need to stop if tuple_indicators is empty (e.g. when all others are dominators/dominatees)
                model.add_linear_constraint(sum(tuple_indicator for tuple_indicator in tuple_indicators.values()) + len(dominators) <= k - 1)
            else:
                model.minimize(sum(tuple_indicator for tuple_indicator in tuple_indicators.values()) + len(dominators) + 1)

        # params = mathopt.SolveParameters(enable_output=True)
        result = mathopt.solve(model, mathopt.SolverType.GSCIP)
        
        if result.termination.reason not in (mathopt.TerminationReason.OPTIMAL, mathopt.TerminationReason.FEASIBLE):
            # Return False if infeasible or other model error
            return False
        
        if explanation_type == ExplanationType.SAT:
            return True
        elif explanation_type == ExplanationType.BEST:
            return result.objective_value()
        elif explanation_type == ExplanationType.POINT:
            return Point(coordinates=[result.variable_values()[weights[attr]] for attr in self.dataset.numeric_attributes])
        else:
            # BOX explanation
            return Box(bottom_left=Point(coordinates=[result.variable_values()[l[attr]] for attr in self.dataset.numeric_attributes]), 
                       top_right=Point(coordinates=[result.variable_values()[h[attr]] for attr in self.dataset.numeric_attributes]))
            
        raise Exception('unsupported explanation type')