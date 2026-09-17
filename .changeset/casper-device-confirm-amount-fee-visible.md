---
"live-mobile": patch
---

Fix the Casper device confirmation step where the Fee and Amount values were blank: they are now rendered inside a Text node via `DataRowUnitValue` instead of being passed as a raw element to `TextValueField`.
