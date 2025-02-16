import os
from typing import Annotated
from fastapi import FastAPI, HTTPException, Path, Query
from pydantic import BaseModel, Field
from whynotyet.provider import *

app = FastAPI(title="Why-Not-Yet")
if os.getenv('MOCK'):
    dataset_provider = MockDatasetProvider()
    explanation_provider = MockExplanationProvider()
else:
    dataset_provider = DatasetProvider()
    explanation_provider = ExplanationProvider()

@app.get("/datasets", response_model_exclude_none=True)
def get_datasets() -> list[Dataset]:
    return dataset_provider.get_datasets()

# {dataset} is the name of a dataset file (including .csv)
@app.get("/datasets/{dataset}")
def get_dataset(dataset: Annotated[str, Path(description="Dataset file name (including extension, e.g. nba_2023_2024.csv)")]) -> Dataset:
    try: 
        return dataset_provider.get_dataset(dataset)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="dataset not found")

class ExplanationRequest(BaseModel):
    dataset: str = Field(description="Dataset file name (including extension, e.g. nba_2023_2024.csv)")
    tuple_id: int = Field(description="Index of tuple in dataset")
    weight_constraints: WeightConstraints
    user_weight_constraints: list[UserWeightConstraint] | None = None

@app.post("/explain/{explanation_type}",
        responses={
            200: {
                "description": "why-not-yet explanation for the requested type given a dataset and a tuple from it",
                "content": {
                    "application/json": {
                        "examples": {
                            "SAT": {'value': True},
                            "BEST": {'value': 1},
                            "POINT": {'value': Point(coordinates=[1, 1]).model_dump()},
                            "BOX": {'value': Box(bottom_left=Point(coordinates=[0, 0]), top_right=Point(coordinates=[1, 1]))}
                        }
                    }
                }
            }
        }
)
def explain(explanation_type: ExplanationType, explanation_request: ExplanationRequest) -> bool | int | Point | Box:
    dataset = dataset_provider.get_dataset(explanation_request.dataset)
    # Overwrite dataset string from ExplanationRequest object with the retrieved dataset in the parameters passed to the explanation provider
    params = {**explanation_request.model_dump(), 'dataset': dataset, 'explanation_type': explanation_type}
    return explanation_provider.explain(**params)