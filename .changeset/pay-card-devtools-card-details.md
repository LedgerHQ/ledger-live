---
"@devtools/pay-card": minor
"@devtools/bindings": minor
---

Show the secure card details image in the Card interaction screen.

- A placeholder stands in for the card until it is pressed, then the provider's image replaces it.
- The image loads straight from the returned URL: its token is the whole credential, so no headers are needed.
- Leaving the screen drops the URL, because the provider spends it on first use and a stale one renders nothing.
- The URL is never rendered as text.
- Asks for the card and PAN colours per colour scheme, so the card number reads as its own surface against the card body.
