---
"ledger-live-desktop": patch
"live-mobile": patch
---

fix NotEnoughGas related UI on LLM and LLD

- fix buy CTA button style on LLD to make it more visible
- add related support link for NotEnoughGas error on LLM and LLD to display an "learn more" CTA redirecting to [related CS article](https://support.ledger.com/hc/en-us/articles/9096370252573?support=true)
- fix buy button when NotEnoughGas on LLM
  - The logic to display the button was related to the currency being sent and not the main account currency (if I don't have enough fund to pay for the gas when I want to send USDT on ethereum, I need to buy some ETH and not some USDT)
  - The related text was wrongly hardcoded only for ethereum currency when a user might be using another evm network and thus needing to buy a different currency than ethereum (i.e: the currency of the actual EVM network he is using)
