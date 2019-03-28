## ledger-live CLI tools

> Please be advised this software is experimental and shall not create any obligation for Ledger to continue to develop, offer, support or repair any of its features. The software is provided “as is.” Ledger shall not be liable for any damages whatsoever including loss of profits or data, business interruption arising from using the software.

```
Usage: ledger-live <command> ...

ledger-live libcoreVersion

ledger-live libcoreReset

ledger-live libcoreSetPassword
  --password <String>: the new password

ledger-live validRecipient
  --recipient (-r) <String>: the address to validate
  --currency (-c) <String>: Identifier of a currency (ledger convention is lowercase/underscore of the currency name)

ledger-live sync
  --device <String>: use a device
  --xpub <String>: instead of using a device, use this xpub
  --file <filename>: instead of using a device, use a file. '-' for stdin
  --currency (-c) <String>: Identifier of a currency (ledger convention is lowercase/underscore of the currency name)
  --scheme (-s) <String>: if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
  --index (-i) <Number>: select the account by index
  --length (-l) <Number>: set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
  --format (-f) <default | json | summary>: how to display the data

ledger-live send
  --device <String>: use a device
  --xpub <String>: instead of using a device, use this xpub
  --file <filename>: instead of using a device, use a file. '-' for stdin
  --currency (-c) <String>: Identifier of a currency (ledger convention is lowercase/underscore of the currency name)
  --scheme (-s) <String>: if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
  --index (-i) <Number>: select the account by index
  --length (-l) <Number>: set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
  --self-transaction: Pre-fill the transaction for the account to send to itself
  --use-all-amount: Send MAX of the account balance
  --recipient <String>: the address to send funds to
  --amount <String>: how much to send in the main currency unit
  --feePerByte <String>: how much fee per byte
  --gasPrice <String>: how much gasPrice in WEI unit! default is 1000000000
  --gasLimit <String>: how much gasLimit. default is estimated with the recipient
  --token (-t) <String>: use an token account children of the account

ledger-live receive
  --device <String>: use a device
  --xpub <String>: instead of using a device, use this xpub
  --file <filename>: instead of using a device, use a file. '-' for stdin
  --currency (-c) <String>: Identifier of a currency (ledger convention is lowercase/underscore of the currency name)
  --scheme (-s) <String>: if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
  --index (-i) <Number>: select the account by index
  --length (-l) <Number>: set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.

ledger-live feesForTransaction
  --device <String>: use a device
  --xpub <String>: instead of using a device, use this xpub
  --file <filename>: instead of using a device, use a file. '-' for stdin
  --currency (-c) <String>: Identifier of a currency (ledger convention is lowercase/underscore of the currency name)
  --scheme (-s) <String>: if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
  --index (-i) <Number>: select the account by index
  --length (-l) <Number>: set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
  --self-transaction: Pre-fill the transaction for the account to send to itself
  --use-all-amount: Send MAX of the account balance
  --recipient <String>: the address to send funds to
  --amount <String>: how much to send in the main currency unit
  --feePerByte <String>: how much fee per byte
  --gasPrice <String>: how much gasPrice in WEI unit! default is 1000000000
  --gasLimit <String>: how much gasLimit. default is estimated with the recipient
  --token (-t) <String>: use an token account children of the account

ledger-live listApps
  --device <String>: use a device
  --format (-f) <raw | json | default>

ledger-live app
  --device <String>: use a device
  --verbose (-v): enable verbose logs
  --install (-i) <String>: install an application by its name
  --uninstall (-u) <String>: uninstall an application by its name
  --open (-o) <String>: open an application by its display name
  --quit (-q): close current application
```
