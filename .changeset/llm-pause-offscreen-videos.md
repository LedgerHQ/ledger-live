---
"live-mobile": patch
---

perf(content-cards): stop offscreen videos from playing

Content card videos played and looped for as long as the card was mounted, including when
another screen covered it. They now pause while their screen is not focused. The Upsell Flex
video now unmounts once another screen covers it, which frees its decoder.
