# Deep Linking Ledger Live Mobile 🔗

Please refer to the exhaustive list on the [Github Wiki](https://github.com/LedgerHQ/ledger-live/wiki/LLM:DeepLinking)

When working on deeplinks, please update the **Wiki** accordingly.

- **_portfolio_** 🠒 Portfolio page (default landing)

  `ledgerlive://` _or_ `ledgerlive://portfolio`

  Account page accessible via several deeplinks

- **_accounts?id_** 🠒 Accounts page

  `ledgerlive://accounts` will redirect to portfolio of accounts page

- **_account?currency_** 🠒 Account Page

  `ledgerlive://account` will redirect to accounts page

  `ledgerlive://account?currency=ethereum&address={{eth_account_address}}` will open a given account if found, will fallback to the currency page found, and if not to the list of accounts

  `?currency` param can be name or ticker of the currency targeted
  `?address` param requires currency to work, address of the account to select

- **_send?currency_** 🠒 Send Flow

  `ledgerlive://send` will redirect to send page

  `ledgerlive://send?currency=ethereum` will redirect to send page with ethereum accounts search prefilled

- **_receive?currency_** 🠒 Receive Flow

  `ledgerlive://receive` will redirect to receive page

  `ledgerlive://receive?currency=ethereum` will redirect to receive page with ethereum accounts search prefilled

- **_buy/:currency_** 🠒 Buy Crypto Flow

  `ledgerlive://buy` will redirect to buy page

  `ledgerlive://buy/bitcoin` will redirect to buy page with bitcoin accounts search prefilled

- **_sell/:currency_** 🠒 Sell Crypto Flow

  `ledgerlive://sell` will redirect to sell page

  `ledgerlive://sell/bitcoin` will redirect to sell page with bitcoin accounts search prefilled

- **_myledger_** 🠒 MyLedger page

  `ledgerlive://myledger` will redirect to myledger page

  `ledgerlive://myledger?installApp=bitcoin` will redirect to myledger page with "bitcoin" app search prefilled

- **_swap_** 🠒 Swap Crypto Flow

  `ledgerlive://swap` will redirect to swap page

- **_add_account?currency_** 🠒 Add Account Crypto Flow

  `ledgerlive://add-account` will redirect to add account page
  `ledgerlive://add-account?currency=ethereum` will redirect to add account page with ethereum accounts search prefilled

- **_discover_** 🠒 Live discover catalog

  `ledgerlive://discover` will redirect to discover page

- **_discover/:APP_ID?params..._** 🠒 Live discover catalog

  `ledgerlive://discover/paraswap?accountId=1` will redirect to the discover catalog page of paraswap with a pre-selected first account

        - *APP_ID* => the url param app id
        - *?params* => the url query params that will be transmitted to the app, you should refer to each apps documentation in order to use them.

- **_custom-image_** 🠒 Custom lock screen flow

  `ledgerlive://custom-image` will redirect to custom lock screen page

- **_earn_** 🠒 Earn Dashboard

  `ledgerlive://earn` will redirect to earn dashboard page

  `ledgerlive://earn?action=stake` will open staking flow

  `ledgerlive://earn?action=stake-account&accountId=1` will open staking flow with selected account prefilled

  `ledgerlive://earn?action=get-funds&currencyId=ethereum` will open buy drawer with specified currency

**_Testing on android_** in order to test in debug your link run using [**_adb_**](https://developer.android.com/training/app-links/deep-linking#testing-filters)

```
  adb shell am start -W -a android.intent.action.VIEW -d "ledgerlive://{{YOUR_URL}}" com.ledger.live.debug
```

**_Testing on ios_** in order to test your link run using xcrun

```
  xcrun simctl openurl booted ledgerlive://{{YOUR_URL}}
```

**_Testing through browser_**

run

```
yarn run test-deep-links
```

Then go to the provided link in order to see a test web page.
For this either redirect the :8000 port on your chrome remote device settings or use the network link provided by the command.
