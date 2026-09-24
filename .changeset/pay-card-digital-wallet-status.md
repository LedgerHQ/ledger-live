---
"@domain/api-card-management": minor
---

Read the two flags the card status response gained.

- `cardAddedToDigitalWallet`: whether the card sits in Apple/Google Wallet.
- `isFreezable`: whether the card may be frozen, which `status` does not say.
- Both optional, so a tenant that answers for neither still parses. They were being dropped: zod strips what the schema does not declare.
- The dev tool's Card Status probe prints the parsed response, so both show there.
