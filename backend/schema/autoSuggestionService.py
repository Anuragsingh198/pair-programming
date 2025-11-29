from pydantic import BaseModel
from typing import List

class AutoSuggestionRequest(BaseModel):
    query: str

class AutoSuggestionResponse(BaseModel):
    suggestions: List[str]
