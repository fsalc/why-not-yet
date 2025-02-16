from typing import Any
from pydantic import BaseModel, Field, computed_field

class Attribute(BaseModel):
    name: str
    numeric: bool

class Dataset(BaseModel):
    name: str = Field(description="Dataset name")
    attributes: list[Attribute] | None = None
    default_weights: list[float] | None = Field(default=None, description="Weights are in order of appeareance of the numeric attributes in original dataset")
    rows: list[Any] | None = None
    
    @property
    def numeric_attributes(self) -> list[str]:
        if self.attributes:
            return [attr.name for attr in self.attributes if attr.numeric]
        return None