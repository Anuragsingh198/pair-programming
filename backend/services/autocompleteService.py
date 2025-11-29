from schema.autoSuggestionService import AutoSuggestionRequest

KEYWORDS = [
    "print", "input", "len", "type", "range", "for", "in", "not", "and", "or",
    "else", "elif", "while", "break", "continue", "return", "yield", "pass",
    "raise", "try", "except", "finally", "with", "as", "def"
]

def get_autocomplete_suggestions(request: AutoSuggestionRequest) -> list[str]:
    return [kw for kw in KEYWORDS if kw.startswith(request.query)]
