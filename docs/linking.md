### Deep Linking 🔗

Several URI schemes are available for deep linking from external sources
They all are prefixed by **_ledgerlive://_**

- **_portfolio_** 🠒 Portfolio page
- **_account?curency_** 🠒 Account Page
- **_send?currency_** 🠒 Send Flow
- **_receive?currency_** 🠒 Receive Flow
- **_buy/:currency_** 🠒 Buy Crypto Flow

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
