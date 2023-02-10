---
"live-mobile": patch
---

fix: several bugs on new system of queued drawers

On QueuedDrawer:
- When loosing focus: all drawers are cleaned, and it now tries to call the onClose of the QueuedDrawer if it tried to be opened after the navigation occurred
- When getting focus: we now check if the drawer was not added just before (drawerId) to avoid adding it several time, because useFocusEffect can be triggered several time in certain cases

On other components:
- For a consumer drawer: onClose needed even if noCloseButton was set to handle lost of screen focus or if other drawer forced it to close
