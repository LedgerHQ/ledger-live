---
"@features/flow-contacts-list": minor
"live-mobile": minor
---

Fix the Contacts alphabetical index on Mobile not scrolling the list to the tapped or dragged letter. The index container now owns the gesture so touch coordinates resolve against it instead of against the tapped letter, which always resolved to the first section, and it keeps the responder instead of losing it to the list underneath on the first drag move. The list supplies `getItemLayout`, so `scrollToLocation` reaches sections below the render window instead of silently giving up on a long contact list. Dragging jumps without animating so a scrub no longer queues one cancelled scroll animation per letter.
