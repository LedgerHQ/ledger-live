---
"live-mobile": minor
---

fix(send): stop reading the send-flow contexts from `SigningBody`

`SigningBody` renders inside the signature bottom sheet, whose children are mounted by a portal at
the app root — outside `SendFlowProvider`. Reading the send-flow contexts from there threw
`useSendFlowData must be used within a SendFlowProvider` and crashed the app on the device-signing
step. The tracking properties and the recipient type are now passed down from
`SignatureDeviceActionView`, which sits in the send-flow tree.
