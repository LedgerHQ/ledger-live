---
"ledger-live-desktop": patch
"live-mobile": patch
---

Fix Stellar "Issuer is invalid" (and wrong lowercase asset code) when adding an asset. The add-asset screens parsed the case-sensitive Stellar code and issuer out of the CAL token id, which CAL lowercases; read them from the case-preserved token fields (name and contractAddress) instead. Also disable the desktop "Continue" button until an asset is selected.
