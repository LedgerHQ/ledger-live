### Deep Linking 🔗

Several URI schemes are available for deep linking from external sources
They all are prefixed by **_ledgerlive://_**

- **_portfolio_** 🠒 Portfolio page (default landing)

  `ledgerlive://` _or_ `ledgerlive://portfolio`

- **_account?currency_** 🠒 Account Page

  `ledgerlive://account` will redirect to accounts page

  `ledgerlive://account?currency=btc` will open first bitcoin account found

  `?currency` param can be name or ticker of the currency targeted

- **_send?currency_** 🠒 Send Flow

  `ledgerlive://send` will redirect to send page

  `ledgerlive://send?currency=ethereum` will redirect to send page with ethereum accounts search prefilled

- **_receive?currency_** 🠒 Receive Flow

  `ledgerlive://receive` will redirect to receive page

  `ledgerlive://receive?currency=ethereum` will redirect to receive page with ethereum accounts search prefilled

- **_buy/:currency_** 🠒 Buy Crypto Flow

  `ledgerlive://buy` will redirect to buy page

  `ledgerlive://buy/bitcoin` will redirect to buy page with bitcoin accounts search prefilled

- **_swap_** 🠒 Swap Crypto Flow

  `ledgerlive://swap` will redirect to swap page

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
