---
"@ledgerhq/coin-near": patch
"ledger-live-desktop": patch
---

fix(near): size staking gas from measured usage and price it the way the chain does

Staking fees priced the attached gas at the current gas price. nearcore buys the gas attached
to a receipt at `max(current_gas_price, min_gas_purchase_price)`, and that floor is an order of
magnitude above the current price on mainnet, so every stake, unstake and withdraw quoted about a
tenth of what the account had to hold. A withdraw quoted at 0.02 NEAR was rejected on broadcast
with `NotEnoughBalance` naming a cost of 0.1759 NEAR.

The fee now uses the same floor the runtime does, and the attached gas drops from 125 TGas (175
for withdraw_all) to 50 TGas for every staking call. The heaviest poolv1 path, the first call in
a new epoch which also restakes and runs the pool's 20 TGas `on_stake_action` callback, was
measured across five mainnet pools: at most 13.64 TGas charged, and 30 TGas attached succeeds on
it. The old budget, bought at the floor, locked 0.2 NEAR for a call that burns about 0.001;
the new one locks 0.055.

Unstake and withdraw are validated against the balance left above storage staking, which is what
the chain checks, instead of the spendable balance that also subtracts the minimum-balance
reserve. The withdraw flow gains the NotEnoughFundsToUnstake banner the unstake flow already
shows, so a real shortfall is explained with the available balance and Buy/Swap/Deposit actions.
