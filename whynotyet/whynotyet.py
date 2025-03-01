from whynotyet.explanation import *
from whynotyet.dataset import *
from typing import Any
from ortools.math_opt.python import mathopt

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

        model = mathopt.Model()
        tuple_indicators = [model.add_integer_variable(lb=0, ub=1, name=f"{i}_is_better") for i in range(len(rows))] # TODO: don't need to create indicator for explained tuple

        
        #TODO choose M to be smaller (but sufficiently large as required)
        M = 1e9

        if explanation_type == ExplanationType.BOX:
            h = {attr: model.add_variable(lb=0, ub=1, name=f"h_{attr}") for attr in self.dataset.numeric_attributes}
            l = {attr: model.add_variable(lb=0, ub=1, name=f"l_{attr}") for attr in self.dataset.numeric_attributes}
            # First constraint in (7)
            for attr in self.dataset.numeric_attributes:
                model.add_linear_constraint(l[attr] <= h[attr])
            # TRIANGLE weight constraint
            # TODO: support others
            model.add_linear_constraint(sum(h_attr for h_attr in h.values()) == 1)
            
            # Indicators using monotonic core
            for s_index, s in enumerate(self.dataset.rows):
                if s_index != tuple_index:
                    # Find monotonic core
                    c = {attr: h[attr] if rows[s_index][i] >= r[i] else l[attr] for i, attr in zip(self.dataset.numeric_indices, self.dataset.numeric_attributes)}
                    model.add_linear_constraint(0 <= sum((r[i] - s[i]) * c[attr] for i, attr in zip(self.dataset.numeric_indices, self.dataset.numeric_attributes)) + M * (tuple_indicators[s_index]))
    
            # Objectives
            model.add_linear_constraint(sum(tuple_indicator for tuple_indicator in tuple_indicators) <= k - 1)
            model.maximize(sum(h[attr] - l[attr] for attr in self.dataset.numeric_attributes))
        elif explanation_type in (ExplanationType.SAT, ExplanationType.POINT, ExplanationType.BEST):
            weights = {attr: model.add_variable(lb=0, ub=1, name=f"weight_{attr}") for attr in self.dataset.numeric_attributes}
            # TRIANGLE weight constraint
            # TODO: support others
            model.add_linear_constraint(sum(weight for weight in weights.values()) == 1)
            
            # Indicators
            for s_index, s in enumerate(self.dataset.rows):
                if s_index != tuple_index:
                    # First constraint in (3) in the paper
                    model.add_linear_constraint(0 <= sum((r[i] - s[i]) * weights[attr] for i, attr in zip(self.dataset.numeric_indices, self.dataset.numeric_attributes)) + M * (tuple_indicators[s_index]))
        
            # Objectives
            if explanation_type != ExplanationType.BEST:
                model.add_linear_constraint(sum(tuple_indicator for tuple_indicator in tuple_indicators) <= k - 1)
            else:
                model.minimize(sum(tuple_indicator for tuple_indicator in tuple_indicators) + 1)

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