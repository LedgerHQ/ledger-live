---
"@ledgerhq/live-e2e-shared": patch
---

Make the Borrow E2E Speculos approval work on touch devices: dispatch on the device model the way
the send flow does — swipe to "Hold to sign" then long-press on Stax/Flex/Nano Gen5, right then both
on Nano S+/X, "Accept and send" on Nano S — instead of hard-coding Nano button presses that a
touchscreen has no way to receive. Clear the "Enable Transaction Check?" opt-in the Ethereum app
shows before its first review, which blocks the review and cannot be dismissed by swipes or presses.
Report a signer failure as a rejection from the executor rather than an unhandled one that kills the
process, and reach the device through the shared helpers so navigation goes through the retry wrapper
and honours `SPECULOS_ADDRESS` instead of assuming localhost.
