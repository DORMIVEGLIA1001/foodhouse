from app.repositories.store import store


class PreferencesService:
    def get_preferences(self) -> dict:
        return store.preferences

    def update_preferences(self, dietary_notes: str | None = None, favorites: list[str] | None = None) -> dict:
        if dietary_notes is not None:
            store.preferences["dietaryNotes"] = dietary_notes
        if favorites is not None:
            store.preferences["favorites"] = favorites
        return store.preferences


preferences_service = PreferencesService()

