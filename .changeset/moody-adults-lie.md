---
"ledger-live-desktop": minor
---

Remove the legacy Wallet 4.0 main-nav feature toggle (`shouldDisplayWallet40MainNav`) and the now-dead legacy navigation code it gated. The new Wallet 4.0 `SideBar` is now always used, and the old `MainSideBar`, `TopBar`, `Stars`, `Help` modal, `ScrollUpButton`, and related unused icons/components have been deleted.
