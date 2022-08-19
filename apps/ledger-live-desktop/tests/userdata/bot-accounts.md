### How to

To generate a bot .json file, proceed as follow:

- download from the CI run, in the bot report, the app.json
- filtered out the operations so the .json isn't too big. You need to have `jq` installed.

```sh
cat before-app.json | jq '.data.accounts[].data.operations = [] | del(.data.accounts[].data.balanceHistoryCache?) | (.data.accounts[].data.subAccounts?) = [] | del(..|.walletAccount?)' > app.json
```
