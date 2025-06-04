---
"live-mobile": minor
---

The provider name was directly used from the provider object, which could lead to inconsistencies. Now using getProviderName utility function to ensure consistent naming across the application.
