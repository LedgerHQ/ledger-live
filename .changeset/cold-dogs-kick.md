---
"live-mobile": patch
---

fix: revert update of babel/core

Reverting `babel/core` from v7.22.1 back to v7.21.0.
This created issues on animations.
For now a fixed version `babel/core` (`7.21.0`) is set.
