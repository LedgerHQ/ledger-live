---
"live-mobile": patch
---

Show the card's balance on the Pay tab's card face.

- The Pay tab passes the countervalue formatter the flow needs, so the face replaces the bare artwork.
- Adds the `payTab.card.balanceLabel` copy the face reads; only desktop had it.
