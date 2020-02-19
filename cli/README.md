## ledger-live CLI tools

> Please be advised this software is experimental and shall not create any obligation for Ledger to continue to develop, offer, support or repair any of its features. The software is provided “as is.” Ledger shall not be liable for any damages whatsoever including loss of profits or data, business interruption arising from using the software.

```
Ledger Live @ https://github.com/LedgerHQ/ledger-live-common

Usage: ledger-live <command> ...

Usage: ledger-live tezosListBakers
     --whitelist              : filter whitelist
     --format <String>        : json | default

Usage: ledger-live app        # Manage Ledger device's apps
     --device <String>        : provide a specific HID path of a device
 -v, --verbose                : enable verbose logs
 -i, --install <String>       : install an application by its name
 -u, --uninstall <String>     : uninstall an application by its name
 -o, --open <String>          : open an application by its display name
 -q, --quit                   : close current application

Usage: ledger-live appsUpdateTestAll # test script to install and uninstall all apps
     --device <String>        : provide a specific HID path of a device
     --index <Number>

Usage: ledger-live balanceHistory # Get the balance history for accounts
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
 -p, --period <String>        : year | month | week
 -f, --format <default | json | asciichart>: how to display the data

Usage: ledger-live broadcast  # Broadcast signed operation(s)
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
 -t, --signed-operation <String>: JSON file of a signed operation (- for stdin)

Usage: ledger-live deviceAppVersion
     --device <String>        : provide a specific HID path of a device

Usage: ledger-live deviceInfo
     --device <String>        : provide a specific HID path of a device

Usage: ledger-live deviceVersion
     --device <String>        : provide a specific HID path of a device

Usage: ledger-live discoverDevices
 -m, --module <String>        : filter a specific module (either hid | ble)
 -i, --interactive            : interactive mode that accumulate the events instead of showing them

Usage: ledger-live exportAccounts # Export given accounts to Live QR or console for importing
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
 -o, --out                    : output to console

Usage: ledger-live firmwareRepair # Repair a firmware update
     --device <String>        : provide a specific HID path of a device
     --forceMCU <String>      : force a mcu version to install

Usage: ledger-live firmwareUpdate # Perform a firmware update
     --device <String>        : provide a specific HID path of a device

Usage: ledger-live generateTestScanAccounts # Generate a test for scan accounts (live-common dataset)
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
 -f, --format <json | default | summary | stats | significantTokenTickers>: how to display the data

Usage: ledger-live generateTestTransaction # Generate a test for transaction (live-common dataset)
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
     --self-transaction       : Pre-fill the transaction for the account to send to itself
     --use-all-amount         : Send MAX of the account balance
     --recipient <String>     : the address to send funds to
     --amount <String>        : how much to send in the main currency unit
     --shuffle                : if using multiple token or recipient, order will be randomized
     --feePerByte <String>    : how much fee per byte
 -t, --token <String>         : use an token account children of the account
     --gasPrice <String>      : how much gasPrice. default is 2gwei. (example format: 2gwei, 0.000001eth, in wei if no unit precised)
     --gasLimit <String>      : how much gasLimit. default is estimated with the recipient
     --fee <String>           : how much fee
     --tag <Number>           : ripple tag
     --mode <String>          : mode of transaction
     --storageLimit <String>  : how much storageLimit. default is estimated with the recipient
     --subAccount <String>    : use a sub account instead of the parent by index
     --fees <String>          : how much fees

Usage: ledger-live genuineCheck # Perform a genuine check with Ledger's HSM
     --device <String>        : provide a specific HID path of a device

Usage: ledger-live getAccountNetworkInfo # Get the currency network info for accounts
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
 -f, --format <json>          : how to display the data

Usage: ledger-live getAddress # Get an address with the device on specific derivations (advanced)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
     --device <String>        : provide a specific HID path of a device
     --path <String>          : HDD derivation path
     --derivationMode <String>: derivationMode to use
 -v, --verify                 : also ask verification on device

Usage: ledger-live getTransactionStatus # Prepare a transaction and returns 'TransactionStatus' meta information
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
     --self-transaction       : Pre-fill the transaction for the account to send to itself
     --use-all-amount         : Send MAX of the account balance
     --recipient <String>     : the address to send funds to
     --amount <String>        : how much to send in the main currency unit
     --shuffle                : if using multiple token or recipient, order will be randomized
     --feePerByte <String>    : how much fee per byte
 -t, --token <String>         : use an token account children of the account
     --gasPrice <String>      : how much gasPrice. default is 2gwei. (example format: 2gwei, 0.000001eth, in wei if no unit precised)
     --gasLimit <String>      : how much gasLimit. default is estimated with the recipient
     --fee <String>           : how much fee
     --tag <Number>           : ripple tag
     --mode <String>          : mode of transaction
     --storageLimit <String>  : how much storageLimit. default is estimated with the recipient
     --subAccount <String>    : use a sub account instead of the parent by index
     --fees <String>          : how much fees
 -f, --format <json>          : how to display the data

Usage: ledger-live libcoreReset

Usage: ledger-live libcoreSetPassword
     --password <String>      : the new password

Usage: ledger-live liveData   # utility for Ledger Live app.json file
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
     --appjson <filename>     : path to a live desktop app.json
 -a, --add                    : add accounts to live data

Usage: ledger-live managerListApps # List apps that can be installed on the device
     --device <String>        : provide a specific HID path of a device
 -f, --format <raw | json | default>

Usage: ledger-live portfolio  # Get a portfolio summary for accounts
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
 -p, --period <String>        : year | month | week

Usage: ledger-live proxy
     --device <String>        : provide a specific HID path of a device
 -f, --file <String>          : in combination with --record, will save all the proxied APDUs to a provided file. If --record is not provided, proxy will start in replay mode of the provided file. If --file is not used at all, the proxy will just act as a proxy without saving the APDU.
 -v, --verbose                : verbose mode
 -s, --silent                 : do not output the proxy logs
     --auto-skip              : auto skip apdu that don't replay instead of error
 -p, --port <String>          : specify the http port to use (default: 8435)
 -r, --record                 : see the description of --file

Usage: ledger-live receive    # Receive crypto-assets (verify on device)
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
     --qr                     : also display a QR Code

Usage: ledger-live repl       # Low level exchange with the device. Send APDUs from stdin.
     --device <String>        : provide a specific HID path of a device
 -f, --file <filename>        : A file can also be provided. By default stdin is used.

Usage: ledger-live send       # Send crypto-assets
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
     --self-transaction       : Pre-fill the transaction for the account to send to itself
     --use-all-amount         : Send MAX of the account balance
     --recipient <String>     : the address to send funds to
     --amount <String>        : how much to send in the main currency unit
     --shuffle                : if using multiple token or recipient, order will be randomized
     --feePerByte <String>    : how much fee per byte
 -t, --token <String>         : use an token account children of the account
     --gasPrice <String>      : how much gasPrice. default is 2gwei. (example format: 2gwei, 0.000001eth, in wei if no unit precised)
     --gasLimit <String>      : how much gasLimit. default is estimated with the recipient
     --fee <String>           : how much fee
     --tag <Number>           : ripple tag
     --mode <String>          : mode of transaction
     --storageLimit <String>  : how much storageLimit. default is estimated with the recipient
     --subAccount <String>    : use a sub account instead of the parent by index
     --fees <String>          : how much fees
     --ignore-errors          : when using multiple transactions, an error won't stop the flow
     --disable-broadcast      : do not broadcast the transaction

Usage: ledger-live signMessage # Sign a message with the device on specific derivations (advanced)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
     --path <String>          : HDD derivation path
     --derivationMode <String>: derivationMode to use
     --message <String>       : the message to sign

Usage: ledger-live sync       # Synchronize accounts with blockchain
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
 -f, --format <json | default | summary | stats | significantTokenTickers>: how to display the data

Usage: ledger-live tezosListBakers
     --whitelist              : filter whitelist
     --format <String>        : json | default

Usage: ledger-live tronSuperRepresentative
     --max <Number>           : max number of super representatives to return
     --format <String>        : json | default

Usage: ledger-live validRecipient # Validate a recipient address
 -r, --recipient <String>     : the address to validate
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
     --device <String>        : provide a specific HID path of a device

Usage: ledger-live version
     --duration <String>      : duration in day
     --resource <String>      : reward ENERGY or BANDWIDTH
     --tronVoteAddress <String>: address of the super representative voting
     --tronVoteCount <String> : number of votes for the vote address
     --ignore-errors          : when using multiple transactions, an error won't stop the flow
     --disable-broadcast      : do not broadcast the transaction

                ``
           `.--:::::
        `.-:::::::::        ` `
       .://///:-..``     `-/+++/-`
     `://///-`           -++++++o/.
    `/+++/:`            -+++++osss+`
   `:++++:`            ./++++-/osss/`
   .+++++`             `-://- .ooooo.
   -+ooo/`                ``  `/oooo-
   .oooo+` .::-.`             `+++++.
   `+oooo:./+++/.             -++++/`
    -ossso+++++:`            -/+++/.
     -ooo+++++:`           .://///.
      ./+++++/`       ``.-://///:`
        `---.`      -:::::///:-.
                    :::::::-.`
                    ....``

```
