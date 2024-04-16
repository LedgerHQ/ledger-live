# Account migration script

## Why

We noticed on Ledger Live that as we release different versions of the app, we might have issue synchronising our accounts on version `n+1` when we could do on version `n`. The account synchronisation can be caused by a change in the data models (accounts, tokens, currencies). 

## How it works

We run the script on every PR to make sure we can correctly synchronise accounts from <target_branch> to <current_branch>.

The steps of the script are:

Run a synchronisation of accounts on version n of ledger live (pull request's target branch by default or develop)
Save the synchronisation output in a file
Run a synchronisation again on the current branch and taking as a input the previous synchronisation from the other branch
Save output of 2nd synchronisation
Check the difference between the two (should have no difference beside lastSyncDate)
The output of synchronisations are raw accounts just as we found in app.json including operations, address, account id, etc.

## How to run locally

On the root of the run 

```bash
pnpm common test-account-migration
```

The following options are available

```typescript
/**
   * comma seperated currencyId
   * eg --currencies ethereum,polygon,bitcoin
   */
  currencies?: CryptoCurrencyId;
  /**
   * absolute path to the output folder for the json file
   */
  outputFolderPath?: string;
  /**
   * absolute path to the input json file
   * must only contain an array of raw accounts
   */
  inputFile?: string;
  /**
   * if set, no file will be created
   */
  noEmit?: boolean;
```

```bash
pnpm common test-account-migration --currencies bitcoin,ethereum
pnpm common test-account-migration --noEmit
pnpm common test-account-migration --outputPathFolder ~/myoutputFolder
pnpm common test-account-migration --inputFile rawAccounts.json
```
