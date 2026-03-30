we are reworking the CLI and we use this wip/ folder to prepare the terrain.
the goal is to allow

```
ledger-cli account discover --network btc --format json > accounts.json
ledger-cli balance --account <descriptor-id>
ledger-cli receive --account <descriptor-id> 
```

do not add these comment and exclusively prepare the terrain in this wip/ folder

I want you to take inspiration from the IDEA_ files too, it's an exploration where we started having new models in.
We can probably anticipate here a models.ts where we inline all the models we need, the goals is to have then a wallet.ts that will be the interface adaptor between the old way of things and the new way of things, essentially we want to expose to the cli side clean models that are fully decoupled (no cycling dep or unserialiable data) and fully ready for serlialisaiton.

When possible, we must use /shared and /domain , this is where the new models will progressively land in the new architecture rework, everything else in libs is to be considered basically legacy. this is why we have this hold folder and adaptor of "compatibility" to build.

models.ts : all the models, inlined when they didn't land in domain yet
compatibility.ts : what makes them compatible with the legacy stack, we will have adaptor functions utilities
wallet.ts : we are building the ideal interface that the CLI can use. it will not have the DMK part but focus on the wallet & account layer.