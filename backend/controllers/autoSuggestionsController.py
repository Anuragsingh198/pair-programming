from fastapi import HTTPException
from schema.autoSuggestionService import AutoSuggestionRequest, AutoSuggestionResponse
from services.autocompleteService import get_autocomplete_suggestions


async def get_auto_suggestions_controller(request: AutoSuggestionRequest) -> AutoSuggestionResponse:
    try:
        suggestions = get_autocomplete_suggestions(request)
        return AutoSuggestionResponse(suggestions=suggestions)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
