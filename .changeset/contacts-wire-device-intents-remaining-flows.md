---
"live-mobile": minor
---

Wire the contacts device intents in the remaining add address flows: adding an external address from the new send flow now goes through the Device Intent Executor instead of the mocked device intents port. The calling drawer closes so the executor can take the queue, and the add address flow closes as it hands the review over to the device
