from pydantic import BaseModel
from typing import List, Optional

class WSMessage(BaseModel):
    event: str
    user: Optional[str] = None
    code: Optional[str] = None
    error: Optional[str] = None
    users: Optional[List[str]] = None
