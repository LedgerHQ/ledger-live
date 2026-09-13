---
"@ledgerhq/coin-casper": patch
---

Accept a `listOperations` `limit` and ignore it, instead of rejecting it.

`limit` is documented as a soft limit — a module "may return less or more" — so ignoring it is
within contract while rejecting it is not, and the generic coin framework now sends one on every
call, which would have failed every casper sync.

Honouring it is not an option here: the indexer offers no cursor, so this module returns the whole
range in one page and never hands back a `next`. A short page would silently drop everything past
the cut, and the next sync resumes above that point and never comes back for it. A caller that
needs its per-page cost bounded cannot get that from this module; what it can bound is how much it
keeps once the page has returned.
