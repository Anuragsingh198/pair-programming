from fastapi import APIRouter
from controllers.autoSuggestionsController import get_auto_suggestions_controller
from schema.autoSuggestionService import AutoSuggestionResponse

router = APIRouter(prefix="/autocomplete", tags=["Autocomplete"])

router.post("/", response_model=AutoSuggestionResponse)(get_auto_suggestions_controller)
