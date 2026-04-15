---
"live-mobile": minor
---

refactor(mobile): replace web3hub account selection with modular asset drawer

Replace the custom SelectAccountModal in the Web3Hub header with the
shared Modular Asset Drawer (MAD) via the existing useSelectAccount hook,
aligning the dApp account selection UX with Swap, Buy, Receive and Stake.
