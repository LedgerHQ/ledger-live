---
"live-mobile": patch
---

Fix the Earn "No funds" → Swap redirect not prefilling the Receive field. The Swap button now forwards the selected account as the swap destination (`defaultAccount`/`defaultParentAccount`), so the chosen asset is preselected in the Receive field, matching the Buy and Receive entry points.
