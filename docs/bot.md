> **Disclaimer**
>
> This is a testing purpose bot. It uses a seed in clear text and DOES NOT guarantee its security. Please **DO NOT** uses an existing seed with this bot. Use a fresh seed dedicated to this usecase (that you can generate with a tool, not with a Nano). The seed is used on computer side so you must assume it will be compromised and that the funds used for the tests are lost. You do not need to send more than 10 USD of each coin to have the bot running.

# Ledger-Live Bot

## Philosophy of ledger-live bot

- **Stateless**: My state is on the blockchain.

- **Configless**: I only need a seed and a coinapps folder.

- **Autonomous**: I simply restore on existing seed accounts and continue from existing blockchain state.

- **Data driven**: My engine is simple and I do actions based on data specs that drives my capabilities.

- **End to End**: I rely on the complete "Ledger stack": live-common which is the same logic behind Ledger Live (derives same accounts, use same transaction logic,..) and Speculos which is the Ledger devices simulator!

- **Realistic**: I am very close to what is the flow of Ledger Live's users and what they would do with the device, I even press device buttons.

- **Completeness**: I can technically do everything a user can do on Ledger Live with their account (send but also any feature of Ledger Live like delegation, freeze, rewards,...) but I'm faster at this job 🤖

- **Automated**: I can run in Github Actions and comments on the Pull Requests and Commits.

- My law is https://en.wikipedia.org/wiki/Three_Laws_of_Robotics

## Getting started

(0) You need `ledger-live` as documented in [cli.md](https://github.com/LedgerHQ/ledger-live-common/blob/master/docs/cli.md)

(1) You need a docker instance. on Mac you can install with:

```
brew cask install docker
```

(2) You need to grab latest 'speculos' image

```
docker pull ghcr.io/ledgerhq/speculos
```

(3) generate a SEED (for instance with https://iancoleman.io/bip39/) and put it in your environment (or `.env` file)

```
export SEED="all the words"
```

(4) Start the bot

```
ledger-live bot
```

## What is it?

Ledger-Live Bot is a script that automatically do transactions with a seed and using Ledger technologies: Ledger Live logic and actual Nano applications running in a simulator called Speculos.

The first time you run it, it will ask you to send funds:

```
Spec 'DogeCoin' found 1 Dogecoin accounts:
 - Dogecoin 1: DOGE 0 (0 operations) (DUAyEjo7CyTMNTmsjDP6SQeeGQ2jSn3U3i on 44'/3'/0'/0/0) (#0 dgub8syAFvdgFQa37hYs1AwxZnEuGwukZHLYUr7MaoVZoHFCFNsEocDc15HGoT8d4rKctePjkT2Lk2bg6KrrHPmXncssUjVD5dBUnyNTtdrS3rF)

This SEED does not have Dogecoin. Please send funds to DUAyEjo7CyTMNTmsjDP6SQeeGQ2jSn3U3i
```

Then, once your have feed him with some crypto currencies, it will be able to do some transactions. This happens each time you run it again:

```
❯ ledger-live bot

Spec 'DogeCoin' found 6 Dogecoin accounts:
    - Dogecoin 1: DOGE 0 (7 operations) (DKELPbzxdWURsNJDe6k6gf7iQxpVBZ71uB on 44'/3'/0'/0/1) (#0 dgub8scvHEPcoET2TQVaKfEMrfCkzjKb5WTLZS7GdUawfbtKhTMvNWG7YpHsAdd3TwrkDDFWBqmSwVeEDJEKXzfF4MUTjTSwpDPGvzPe9CSF6Ke)
    - Dogecoin 2: DOGE 0.345 (9 operations) (DFDREfe6CUtsPA6hVAjE5jy8AdGWueU1JM on 44'/3'/1'/0/5) (#1 dgub8scvHEPcoET2ViPWsci8ScV92BnD2r18rj1FUJhcJC9gsXERdaJE86X4rUsu27NmMdg5dxUZ1aKDtu5ixkhRZf6dEKFykdPdTunysDLafqG)
    - Dogecoin 3: DOGE 0.2855 (11 operations) (DEEaaSCWEyhtozjhmZ1UWZpBt44XHvLNjN on 44'/3'/2'/0/7) (#2 dgub8scvHEPcoET2WEcMdBZCHJb6tYt3HG5rxrr9YedJbudtKrsV2wNPGvQQkPp5skbsavUFQRokwhwtnSC8nozF6ykbUPSB1BevDNjHGj8dXzr)
    - Dogecoin 4: DOGE 0.094 (11 operations) (DA2zVLNkHFNcLW6TgyQFbDVQoMUWsSApP6 on 44'/3'/3'/0/6) (#3 dgub8scvHEPcoET2a81PNRN8Ac6ZnZcZA4Utr84dqKqsUGgyKJM2bfRu14BqgZWAeahzzPQ1mijDrAwaYdLUeLmL7rpiDVVzrUy5DdnEx2BLEsx)
    - Dogecoin 5: DOGE 0.0595 (4 operations) (DJS1krKU9J8XXJCkFMa6jkwTVHnvxNEpCq on 44'/3'/4'/0/2) (#4 dgub8scvHEPcoET2da19ZZP5CjDHcJbxRUfDEC8uc27rqKkU5bLyNq1vhhBFF4dMsb3PShk9EoG8HHNdQLPdhSDyY7AKcSAPwjQ1aiFN9s5oQob)
    - Dogecoin 6: DOGE 0 (0 operations) (DGBDfSM8eeJWCotXQakHC3qBRNw6wTMYuU on 44'/3'/5'/0/0) (#5 dgub8scvHEPcoET2fkvgfFqxHL1VgHkMPyWC2iRygQQ2NNh8yJxopYTUUJgmSvkhxRbXBrBQoAi8Y8jbzmar6YUbpnZhM95nfyW7Kb3kaj7UH9n)

(spec 'DogeCoin')
▬ app Dogecoin 1.3.21 on nanoS 1.6.0
→ FROM Dogecoin 1: DOGE 0 (7 operations) (DKELPbzxdWURsNJDe6k6gf7iQxpVBZ71uB on 44'/3'/0'/0/1) (#0 dgub8scvHEPcoET2TQVaKfEMrfCkzjKb5WTLZS7GdUawfbtKhTMvNWG7YpHsAdd3TwrkDDFWBqmSwVeEDJEKXzfF4MUTjTSwpDPGvzPe9CSF6Ke)
🤷‍♂️ couldn't find a mutation to do! (move 50% to another account: balance is too low, send max to another account: balance is too low)

(spec 'DogeCoin')
▬ app Dogecoin 1.3.21 on nanoS 1.6.0
→ FROM Dogecoin 2: DOGE 0.345 (9 operations) (DFDREfe6CUtsPA6hVAjE5jy8AdGWueU1JM on 44'/3'/1'/0/5) (#1 dgub8scvHEPcoET2ViPWsci8ScV92BnD2r18rj1FUJhcJC9gsXERdaJE86X4rUsu27NmMdg5dxUZ1aKDtu5ixkhRZf6dEKFykdPdTunysDLafqG)
★ using mutation 'send max to another account'
→ TO Dogecoin 1: DOGE 0 (7 operations) (DKELPbzxdWURsNJDe6k6gf7iQxpVBZ71uB on 44'/3'/0'/0/1) (#0 dgub8scvHEPcoET2TQVaKfEMrfCkzjKb5WTLZS7GdUawfbtKhTMvNWG7YpHsAdd3TwrkDDFWBqmSwVeEDJEKXzfF4MUTjTSwpDPGvzPe9CSF6Ke)
✔️ doing transaction
    SEND MAX
    TO DKELPbzxdWURsNJDe6k6gf7iQxpVBZ71uB
    with feePerByte=100000 (network fees: 0=100000, 1=100000, 2=100000)
with transaction status:
    amount: DOGE 0.005
    estimated fees: DOGE 0.34
    total spent: DOGE 0.345
    warnings: feeTooHigh: FeeTooHigh
✔️ has been signed! (3.6s)
✔️ broadcasted! (160ms) optimistic operation:
    - DOGE 0.34        OUT        7041a8f4f91acff1439c106f851a550b0c73d2ffc02e691244e5e365a67b9351     2020-05-20T07:37:06.916Z
✔️ operation confirmed (5.8s):
    - DOGE 0.345       OUT        7041a8f4f91acff1439c106f851a550b0c73d2ffc02e691244e5e365a67b9351     2020-05-20T07:37:07.000Z
account updated:
    Dogecoin 2: DOGE 0 (10 operations) (DFDREfe6CUtsPA6hVAjE5jy8AdGWueU1JM on 44'/3'/1'/0/5) (#1 dgub8scvHEPcoET2ViPWsci8ScV92BnD2r18rj1FUJhcJC9gsXERdaJE86X4rUsu27NmMdg5dxUZ1aKDtu5ixkhRZf6dEKFykdPdTunysDLafqG)

(spec 'DogeCoin')
▬ app Dogecoin 1.3.21 on nanoS 1.6.0
→ FROM Dogecoin 3: DOGE 0.2855 (11 operations) (DEEaaSCWEyhtozjhmZ1UWZpBt44XHvLNjN on 44'/3'/2'/0/7) (#2 dgub8scvHEPcoET2WEcMdBZCHJb6tYt3HG5rxrr9YedJbudtKrsV2wNPGvQQkPp5skbsavUFQRokwhwtnSC8nozF6ykbUPSB1BevDNjHGj8dXzr)
★ using mutation 'send max to another account'
→ TO Dogecoin 1: DOGE 0.005 (8 operations) (DCNzLfToGBpVARuBcQ3F8VGVZZL7Akqrsk on 44'/3'/0'/0/2) (#0 dgub8scvHEPcoET2TQVaKfEMrfCkzjKb5WTLZS7GdUawfbtKhTMvNWG7YpHsAdd3TwrkDDFWBqmSwVeEDJEKXzfF4MUTjTSwpDPGvzPe9CSF6Ke)
✔️ doing transaction
    SEND MAX
    TO DCNzLfToGBpVARuBcQ3F8VGVZZL7Akqrsk
    with feePerByte=100000 (network fees: 0=100000, 1=100000, 2=100000)
with transaction status:
    amount: DOGE 0.0935
    estimated fees: DOGE 0.192
    total spent: DOGE 0.2855
    warnings: feeTooHigh: FeeTooHigh
✔️ has been signed! (2838ms)
✔️ broadcasted! (145ms) optimistic operation:
    - DOGE 0.192       OUT        2b5d590c684258253134c7babf72cd29ee12173980948abf42cb67e5d711175d     2020-05-20T07:37:17.328Z
✔️ operation confirmed (5.3s):
    - DOGE 0.2855      OUT        2b5d590c684258253134c7babf72cd29ee12173980948abf42cb67e5d711175d     2020-05-20T07:37:17.000Z
account updated:
    Dogecoin 3: DOGE 0 (12 operations) (DEEaaSCWEyhtozjhmZ1UWZpBt44XHvLNjN on 44'/3'/2'/0/7) (#2 dgub8scvHEPcoET2WEcMdBZCHJb6tYt3HG5rxrr9YedJbudtKrsV2wNPGvQQkPp5skbsavUFQRokwhwtnSC8nozF6ykbUPSB1BevDNjHGj8dXzr)

(spec 'DogeCoin')
▬ app Dogecoin 1.3.21 on nanoS 1.6.0
→ FROM Dogecoin 4: DOGE 0.094 (11 operations) (DA2zVLNkHFNcLW6TgyQFbDVQoMUWsSApP6 on 44'/3'/3'/0/6) (#3 dgub8scvHEPcoET2a81PNRN8Ac6ZnZcZA4Utr84dqKqsUGgyKJM2bfRu14BqgZWAeahzzPQ1mijDrAwaYdLUeLmL7rpiDVVzrUy5DdnEx2BLEsx)
★ using mutation 'move 50% to another account'
→ TO Dogecoin 6: DOGE 0 (0 operations) (DGBDfSM8eeJWCotXQakHC3qBRNw6wTMYuU on 44'/3'/5'/0/0) (#5 dgub8scvHEPcoET2fkvgfFqxHL1VgHkMPyWC2iRygQQ2NNh8yJxopYTUUJgmSvkhxRbXBrBQoAi8Y8jbzmar6YUbpnZhM95nfyW7Kb3kaj7UH9n)
✔️ doing transaction
    SEND DOGE 0.047
    TO DGBDfSM8eeJWCotXQakHC3qBRNw6wTMYuU
    with feePerByte=100000 (network fees: 0=100000, 1=100000, 2=100000)
with transaction status:
    amount: DOGE 0.047
    estimated fees: DOGE 0
    total spent: DOGE 0.047
    errors: amount: NotEnoughBalance
⚠️ NotEnoughBalance: NotEnoughBalance

(spec 'DogeCoin')
▬ app Dogecoin 1.3.21 on nanoS 1.6.0
→ FROM Dogecoin 5: DOGE 0.0595 (4 operations) (DJS1krKU9J8XXJCkFMa6jkwTVHnvxNEpCq on 44'/3'/4'/0/2) (#4 dgub8scvHEPcoET2da19ZZP5CjDHcJbxRUfDEC8uc27rqKkU5bLyNq1vhhBFF4dMsb3PShk9EoG8HHNdQLPdhSDyY7AKcSAPwjQ1aiFN9s5oQob)
★ using mutation 'move 50% to another account'
→ TO Dogecoin 4: DOGE 0.094 (11 operations) (DA2zVLNkHFNcLW6TgyQFbDVQoMUWsSApP6 on 44'/3'/3'/0/6) (#3 dgub8scvHEPcoET2a81PNRN8Ac6ZnZcZA4Utr84dqKqsUGgyKJM2bfRu14BqgZWAeahzzPQ1mijDrAwaYdLUeLmL7rpiDVVzrUy5DdnEx2BLEsx)
✔️ doing transaction
    SEND DOGE 0.02975
    TO DA2zVLNkHFNcLW6TgyQFbDVQoMUWsSApP6
    with feePerByte=100000 (network fees: 0=100000, 1=100000, 2=100000)
with transaction status:
    amount: DOGE 0.02975
    estimated fees: DOGE 0
    total spent: DOGE 0.02975
    errors: amount: NotEnoughBalance
⚠️ NotEnoughBalance: NotEnoughBalance
```

What the test engine is simply doing is scanning accounts with the seed and for each of them it randomly selects a possible transaction to do to one of the other sibling account.

We can see here that for EACH account of my seed, it tries to do a transaction. At this current stage, we only have defined 2 possible transactions. This is highly driven by defining these "mutations" for all coins (what are all the possible actions that can be performed on these actions). Once they are all defined, we can assume the accounts will transition over and "see" all the possible states we support.

Essentially, 95% of the focus of Ledger-Live Bot is about maintaining and defining all possible scenarios one can do with Ledger Live and the bot autonomously do them with the whole Ledger stack (live-common, nano app running in speculos).

> Note: in the example above, we can see some errors are happening, which actually made the test fails. This is because we are too optimistic on the minimal account required for the fees. In the future, when we fix this, everything should fall into the case `🤷‍♂️ couldn't find a mutation to do!` which is not an error.

### Test expectations

- test the basics of Ledger Live: scan accounts, synchronisation,... (de facto covered that as part of the engine)
- test device screen and actions to do on it
- test device signature and broadcast success
- test the outcome of a transaction (mutation updates in the account)

### Pitfalls and non goals

- It focus on only the successful transactions: at the moment, a mutation expresses something that is POSSIBLE and not error cases. We only cover the successful transaction cases, it does not cover error cases => for now, there are to be done in live-common datasets.
- not all apps are currently supported in Speculos and available in coinapps.
- It does not assert in ONE TIME all possible transactions, it would be impossible to do.
- It only works for one app. will not work for more complex flow involving disconnections / dashboard.

## What does a spec looks like

- types: https://github.com/LedgerHQ/ledger-live-internal-tests/blob/master/speculos-bot/src/engine/types.js
- examples: https://github.com/LedgerHQ/ledger-live-internal-tests/tree/master/speculos-bot/src/specs

```js
function deviceActionAcceptBitcoin({
  transport,
  event,
}: {
  transport: typeof Transport & { button: (string) => void },
  event: { type: string, text: string },
}) {
  if (event.text.startsWith("Accept")) {
    transport.button("LRlr");
  } else if (
    event.text.startsWith("Review") ||
    event.text.startsWith("Amount") ||
    event.text.startsWith("Address") ||
    event.text.startsWith("Confirm") ||
    event.text.startsWith("Fees")
  ) {
    transport.button("Rr");
  }
}

const dogecoinSpec: AppSpec<*> = {
  name: "DogeCoin",
  currency: getCryptoCurrencyById("dogecoin"),
  dependency: "Bitcoin",
  appQuery: {
    model: "nanoS",
    appName: "Dogecoin",
    firmware: "1.6.0",
    appVersion: "1.3.x",
  },
  mutations: [
    {
      name: "send max",
      transaction: ({ account, siblings, bridge }) => {
        invariant(account.balance.gt(100000), "balance is too low");
        let t = bridge.createTransaction(account);
        const sibling = pickSiblings(siblings);
        const recipient = sibling.freshAddress;
        t = bridge.updateTransaction(t, { useAllAmount: true, recipient });
        return t;
      },
      deviceAction: deviceActionAcceptBitcoin,
      test: ({
        account,
        accountBeforeTransaction,
        transaction,
        optimisticOperation,
        operation,
      }) => {
        expect(account.balance.toString()).toBe("0");
      },
    },
  ],
};
```

## How does the engine works

Source code: https://github.com/LedgerHQ/ledger-live-internal-tests/tree/master/speculos-bot/src/engine

## Glossary

### Spec

a "spec" group all scenarios of transactions to do for a given currency. It describes the app to use and the mutations that are possible to run and how to run them.

### Mutation

We call a possible actions (transactions) to do on an account a MUTATION because it mutates the account state on the blockchain. We typically will have a mutation defined by expression of the transaction, the action to do on the device (`deviceAction`) and potentially an assertion test that goes with it.

### 'coinapps' folder

A coinapps folder is a folder that contains Nano apps binaries (.elf) in a specific structure:

```
<device>/<firmware>/<appName>/app_<appVersion>.elf
```

For instance

```
nanos/1.6.0/Bitcoin/app_1.3.20.elf
```

We currently only have an internal one at https://github.com/LedgerHQ/coin-apps but we might have a public mirror will happen in the future.
