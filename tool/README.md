## ledger-live CLI tools

> Please be advised this software is experimental and shall not create any obligation for Ledger to continue to develop, offer, support or repair any of its features. The software is provided “as is.” Ledger shall not be liable for any damages whatsoever including loss of profits or data, business interruption arising from using the software.

```

Ledger Live @ https://github.com/LedgerHQ/ledger-live-common

Usage: ledger-live <command> ...

Usage: ledger-live version

Usage: ledger-live libcoreReset

Usage: ledger-live libcoreSetPassword
     --password <String>      : the new password

Usage: ledger-live proxy
     --device <String>        : provide a specific HID path of a device
 -f, --file <String>          : in combination with --record, will save all the proxied APDUs to a provided file. If --record is not provided, proxy will start in replay mode of the provided file. If --file is not used at all, the proxy will just act as a proxy without saving the APDU.
 -v, --verbose                : verbose mode
 -s, --silent                 : do not output the proxy logs
 -p, --port <String>          : specify the http port to use (default: 8435)
 -r, --record                 : see the description of --file

Usage: ledger-live discoverDevices
 -m, --module <String>        : filter a specific module (either hid | ble)
 -i, --interactive            : interactive mode that accumulate the events instead of showing them

Usage: ledger-live deviceVersion
     --device <String>        : provide a specific HID path of a device

Usage: ledger-live deviceAppVersion
     --device <String>        : provide a specific HID path of a device

Usage: ledger-live deviceInfo
     --device <String>        : provide a specific HID path of a device

Usage: ledger-live repl       # Low level exchange with the device. Send APDUs from stdin.
     --device <String>        : provide a specific HID path of a device
 -f, --file <filename>        : A file can also be provided. By default stdin is used.

Usage: ledger-live liveQR     # Show Live QR Code to export to mobile
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.

Usage: ledger-live genuineCheck # Perform a genuine check with Ledger's HSM
     --device <String>        : provide a specific HID path of a device

Usage: ledger-live firmwareUpdate # Perform a firmware update
     --device <String>        : provide a specific HID path of a device

Usage: ledger-live firmwareRepair # Repair a firmware update
     --device <String>        : provide a specific HID path of a device
     --forceMCU <String>      : force a mcu version to install

Usage: ledger-live managerListApps # List apps that can be installed on the device
     --device <String>        : provide a specific HID path of a device
 -f, --format <raw | json | default>

Usage: ledger-live app        # Manage Ledger device's apps
     --device <String>        : provide a specific HID path of a device
 -v, --verbose                : enable verbose logs
 -i, --install <String>       : install an application by its name
 -u, --uninstall <String>     : uninstall an application by its name
 -o, --open <String>          : open an application by its display name
 -q, --quit                   : close current application

Usage: ledger-live validRecipient # Validate a recipient address
 -r, --recipient <String>     : the address to validate
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
     --device <String>        : provide a specific HID path of a device

Usage: ledger-live getAddress # Get an address with the device on specific derivations (advanced)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
     --path <String>          : HDD derivation path
     --derivationMode <String>: derivationMode to use
 -v, --verify                 : also ask verification on device

Usage: ledger-live feesForTransaction # Calculate how much fees a given transaction is going to cost
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --self-transaction       : Pre-fill the transaction for the account to send to itself
     --use-all-amount         : Send MAX of the account balance
     --recipient <String>     : the address to send funds to
     --amount <String>        : how much to send in the main currency unit
     --feePerByte <String>    : how much fee per byte
     --gasPrice <String>      : how much gasPrice. default is 2gwei. (example format: 2gwei, 0.000001eth, in wei if no unit precised)
     --gasLimit <String>      : how much gasLimit. default is estimated with the recipient
 -t, --token <String>         : use an token account children of the account

Usage: ledger-live sync       # Synchronize accounts with blockchain
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
 -f, --format <json | default | summary>: how to display the data

Usage: ledger-live receive    # Receive crypto-assets (verify on device)
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --qr                     : also display a QR Code

Usage: ledger-live send       # Send crypto-assets
     --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --self-transaction       : Pre-fill the transaction for the account to send to itself
     --use-all-amount         : Send MAX of the account balance
     --recipient <String>     : the address to send funds to
     --amount <String>        : how much to send in the main currency unit
     --feePerByte <String>    : how much fee per byte
     --gasPrice <String>      : how much gasPrice. default is 2gwei. (example format: 2gwei, 0.000001eth, in wei if no unit precised)
     --gasLimit <String>      : how much gasLimit. default is estimated with the recipient
 -t, --token <String>         : use an token account children of the account
 -f, --format <default | json>: how to display the data

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
