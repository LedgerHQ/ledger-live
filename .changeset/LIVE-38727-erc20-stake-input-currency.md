---
"@ledgerhq/transaction-observability": minor
---

Report the staked token as `input_currency` for StakeKit's USDe and POL stakes, not the network coin. These calls come from the parent ETH account, so the token is known only from the contract that was called. The contract map now carries an optional `inputCurrency` next to `outputCurrency`. The POL entry covers one Polygon validator, because each validator has its own ValidatorShare contract. The StakeKit USDe vault also reports `output_currency: stk-USDe`, the vault share token the user receives. CAL does not list it, so the drift guard cannot check it.
