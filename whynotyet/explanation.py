from enum import Enum
from pydantic import BaseModel, Field

class ExplanationType(str, Enum):
    SAT = "sat"
    BEST = "best"
    POINT = "point"
    BOX = "box"
    
class Point(BaseModel):
    coordinates: list[float] = Field(description="Coordinates are in order of appeareance of the numeric attributes in original dataset")

class WeightConstraints(str, Enum):
    CUBE = "cube"
    TRIANGLE = "triangle"
    
class Box(BaseModel):
    bottom_left: Point
    top_right: Point

class UserWeightConstraint(BaseModel):
    attribute: str
    lower_bound: float
    upper_bound: float