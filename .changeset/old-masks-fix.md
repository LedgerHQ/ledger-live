---
"live-mobile": patch
---

feat: new bluetooth requirements error views

Components handling different requirements error views:

- bluetooth permissions not granted
- bluetooth disabled
- location permissions nos granted (if needed)
- location disabled (if needed)
  using a new GenericInformationalView component.

Also some cleaning on error message handling and how some requirements checks were handled
