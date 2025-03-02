from whynotyet.dataset import Dataset, Attribute
from whynotyet.explanation import ExplanationType, Box, WeightConstraints, UserWeightConstraint, Point
from pathlib import Path
import os
import glob

from whynotyet.whynotyet import Explainer

################
### Datasets ###
################

DATA_ROOT = './data'

class DatasetProvider():
    def get_datasets(self) -> list[Dataset]:
        return [dataset.split('/')[-1] for dataset in glob.glob('./data/*.csv')]
    
    def get_dataset(self, path: str) -> Dataset:
        name = Path(path).name # sanitize user input dataset name which is used as path
        path = os.path.join(DATA_ROOT, name)
        return Dataset(name=name).load(path) 
    
class MockDatasetProvider():
    def get_datasets(self):
        return [Dataset(name='nba_2023_2024.csv'), Dataset(name='csrankings.csv')]
    
    def get_dataset(self, name: str):
        if name == 'nba_2023_2024.csv':
            return Dataset(name='nba_2023_2024.csv', 
                attributes=[
                    Attribute(name='Player', numeric=False),    
                    Attribute(name='PTS', numeric=True),    
                    Attribute(name='TRB', numeric=True),    
                    Attribute(name='AST', numeric=True),    
                    Attribute(name='STL', numeric=True),    
                    Attribute(name='BLK', numeric=True),    
                ], 
                default_weights=[0.2, 0.2, 0.2, 0.2, 0.2], 
                rows=[
                    ['Nikola Jokić',2085,976,708,108,68],
                    ['Luka Dončić',2370,647,686,99,38],
                    ['Giannis Antetokounmpo',2222,841,476,87,79]
                ])
        elif name == 'csrankings.csv':
            return Dataset(name='cars.csv', 
                attributes=[
                    Attribute(name='Institution', numeric=False),
                    Attribute(name='Count AI', numeric=True),    
                    Attribute(name='Faculty AI', numeric=True),   
                    Attribute(name='Count Systems', numeric=True),    
                    Attribute(name='Faculty Systems', numeric=True),   
                    Attribute(name='Count Theory', numeric=True),    
                    Attribute(name='Faculty Theory', numeric=True),   
                    Attribute(name='Count Interdisciplinary', numeric=True),    
                    Attribute(name='Faculty Interdisciplinary', numeric=True),   
                ],
                default_weights=[0, 0.25, 0, 0.25, 0, 0.25, 0, 0.25], 
                rows=[
                    ['Carnegie Mellon University',71.4,93.0,11.9,77.0,21.1,29.0,13.8,94.0],
                    ['Univ. of Illinois at Urbana-Champaign',46.1,66.0,12.6,70.0,16.0,20.0,7.2,51.0],
                    ['Univ. of California - San Diego',31.6,57.0,9.0,58.0,10.1,18.0,10.3,58.0]
                ])
        else:
            raise FileNotFoundError

####################
### Explanations ###
####################

class ExplanationProvider():
    def explain(self, dataset: Dataset, tuple_id: int, k: int, explanation_type: ExplanationType, weight_constraints: WeightConstraints, user_weight_constraints: list[UserWeightConstraint] | None) -> bool | int | Point | Box:
        dataset = dataset.load(f"data/{dataset.name}") # Load data into Dataset in case it has not been already
        explainer = Explainer(dataset)
        return explainer.explain(tuple_id, k, explanation_type, weight_constraints, user_weight_constraints)

class MockExplanationProvider(ExplanationProvider):
    def explain(self, dataset: Dataset, tuple_id: int, k: int, explanation_type: ExplanationType, weight_constraints: WeightConstraints, user_weight_constraints: list[UserWeightConstraint] | None) -> bool | int | Point | Box:
        if dataset.numeric_attributes is None:
            raise Exception('dataset must be a full dataset and not a stub')
        if explanation_type == ExplanationType.SAT:
            return True
        elif explanation_type == ExplanationType.BEST:
            return 1
        elif explanation_type == ExplanationType.POINT:
            return Point(coordinates=[1 for _ in dataset.numeric_attributes])
        elif explanation_type == ExplanationType.BOX:
            bottom_left = Point(coordinates=[0 for _ in dataset.numeric_attributes])
            top_right = Point(coordinates=[1 for _ in dataset.numeric_attributes])
            return Box(bottom_left=bottom_left, top_right=top_right)