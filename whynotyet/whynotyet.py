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
        tuple = rows[tuple_index]

        model = mathopt.Model()
        weights = {attr: model.add_variable(lb=0, ub=1, name=f"weight_{attr}") for attr in self.dataset.numeric_attributes}
        tuple_indicators = [model.add_integer_variable(lb=0, ub=1, name=f"{i}_is_better") for i in range(len(rows))] # TODO: don't need to create indicator for explained tuple

        
        #TODO choose M to be smaller (but sufficiently large as required)
        M = 1e9
        if explanation_type == ExplanationType.BOX:
            return NotImplementedError()
        else:
            # SAT, BEST, and POINT
            
            # Indicators
            for row_index, row in enumerate(self.dataset.rows):
                if row_index != tuple_index:
                    # First constraint in (3) in the paper
                    model.add_linear_constraint(0 <= sum((tuple[i] - row[i]) * weights[attr] for i, attr in zip(self.dataset.numeric_indices, self.dataset.numeric_attributes)) + M * (tuple_indicators[row_index]))
            
            # TRIANGLE weight constraint
            # TODO: support others
            model.add_linear_constraint(sum(weight for weight in weights.values()) == 1)
            
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
            else:
                # POINT explanation
                return Point(coordinates=[result.variable_values()[weights[attr]] for attr in self.dataset.numeric_attributes])
            
        raise Exception('unsupported explanation type')