---
"ledger-live-desktop": minor
---

Fix Zcash shielded send follow-ups in the new Send flow

The maturing-funds notice on the balance-type step was cut off because its whole sentence was
packed into the banner title; it now splits into a title and a description like every other
validation banner.

Two error cases had no translation and fell back to the raw class name under a "contact support"
description: sending to a `u1…` address before the private balance's viewing key has been exported,
and a rare backend drift where a scanned note is not yet spendable by the builder.

The new flow was also missing two shielded-sync triggers that the legacy Send modal already had: a
resync right after broadcasting a private transfer, and one when entering the Amount step with the
private pool selected. Both are wired through the same family-component slots the flow already uses
for its other Zcash-specific screens.

Pasting the unified (shielded) address of one of the user's own Zcash accounts did not resolve to
anything useful -- only the transparent fresh address was recognized, and even then it showed the
account's name rather than which pool it is. Recipient matching now goes through the coin-families
contract so a family can declare every address its accounts are recognizable by, and an address that
is the account's own self-transfer target now shows its pool label ("Private balance") instead,
matching what the self-transfer shortcut already produces.

The balance-selection step showed an aggregate balance and an account name that don't belong on a
screen whose only purpose is picking between two pools; both are gone, matching the design, and the
step's title now reads "Select balance". Every following step's header now shows which pool was
picked next to the account name and balance (e.g. "ZEC 1 (Private balance) · 0.2 ZEC") -- resolved
from the send descriptor, so every other currency's header is unchanged.
