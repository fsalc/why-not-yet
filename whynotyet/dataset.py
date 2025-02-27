from typing import Any
from pydantic import BaseModel, Field, computed_field
import pandas as pd
from pandas.api.types import is_numeric_dtype

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
    
    @property
    def numeric_indices(self) -> list[str]:
        if self.attributes:
            return [i for i, attr in enumerate(self.attributes) if attr.numeric]
        return None
    
    def load(self, path):
        '''
        Load attributes and rows from file in path
        '''
        
        df = pd.read_csv(path)
        self.attributes = list(map(lambda attribute: Attribute(name=attribute, numeric=is_numeric_dtype(df[attribute])), list(df.columns)))
        self.rows = list(map(lambda r: list(r.values()), df.to_dict(orient='records')))
        # TODO: provide default weights to front-end for use in setting user weight constraints
        
        return self