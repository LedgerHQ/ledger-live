# ledger-live CLI

> Please be advised this software is experimental and shall not create any obligation for Ledger to continue to develop, offer, support or repair any of its features. The software is provided “as is.” Ledger shall not be liable for any damages whatsoever including loss of profits or data, business interruption arising from using the software.

This package wraps functionality from `@ledgerhq/live-common` into a suite of tools that can be used directly from the terminal

# Usage

## Install the CLI

```bash
npm i --global @ledgerhq/live-cli
```

## Run commands

Jump to the [documentation](#Documentation) for more informations on the available commands

```bash
ledger-live <commands>
```

# Development

## Setup

### Requirements

- [NodeJS](https://nodejs.org) `lts/fermium` (v14.x)
- [PnPm](https://pnpm.io) (v7.x)
- [Python](https://www.python.org/) (v3.5+)
- On Linux: `sudo apt-get update && sudo apt-get install libudev-dev libusb-1.0-0-dev`

## Install

> Reminder: all commands should be run at the root of the monorepository

```bash
# install dependencies
pnpm i
```

## Dev

```bash
# launch a watch mode on the source files and recompiles on the fly
pnpm dev:cli
```

## Run

```bash
# run a command of the cli
pnpm run:cli <command>
```

## Build

```bash
# build the cli for publishing
pnpm build:cli
```

# Documentation

`````
Usage: ledger-live <command> ...

Usage: ledger-live celoValidatorGroups

Usage: ledger-live cosmosValidators
     --format <String>        : json | default

Usage: ledger-live tezosListBakers
     --whitelist              : filter whitelist
     --format <String>        : json | default

Usage: ledger-live tronSuperRepresentative
     --max <Number>           : max number of super representatives to return
     --format <String>        : json | default

Usage: ledger-live polkadotValidators
     --format <String>        : json|csv|default
     --status <String>        : The status of the validators to fetch (all|elected|waiting)
     --validator <String>     : address of recipient validator that will receive the delegate

Usage: ledger-live app        # Manage Ledger device's apps
 -d, --device <String>        : provide a specific HID path of a device
 -v, --verbose                : enable verbose logs
 -i, --install <String>       : install an application by its name
 -u, --uninstall <String>     : uninstall an application by its name
 -o, --open <String>          : open an application by its display name
     --debug <String>         : get information of an application by its name
 -q, --quit                   : close current application

Usage: ledger-live appUninstallAll # uninstall all apps in the device
 -d, --device <String>        : provide a specific HID path of a device

Usage: ledger-live appsCheckAllAppVersions # install/uninstall all possible apps available on our API to check all is good (even old app versions)
 -d, --device <String>        : provide a specific HID path of a device
 -m, --memo                   : a file to memorize the previously saved result so we don't run again from the start

Usage: ledger-live appsInstallAll # test script to install and uninstall all apps
 -d, --device <String>        : provide a specific HID path of a device

Usage: ledger-live appsUpdateTestAll # test script to install and uninstall all apps
 -d, --device <String>        : provide a specific HID path of a device
     --index <Number>

Usage: ledger-live balanceHistory # Get the balance history for accounts
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
 -p, --period <String>        : all | year | month | week | day
 -f, --format <default | json | asciichart>: how to display the data

Usage: ledger-live bot        # Run a bot test engine with speculos that automatically create accounts and do transactions
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -m, --mutation <String>      : filter the mutation to run by a regexp pattern

Usage: ledger-live botPortfolio # Use speculos and a list of supported coins to retrieve all accounts
 -f, --format <operationBalanceHistoryBackwards | operationBalanceHistory | json | head | default | basic | full | stats | significantTokenTickers>: how to display the data

Usage: ledger-live botTransfer # transfer funds from one seed (SEED) to another (SEED_RECIPIENT)

Usage: ledger-live broadcast  # Broadcast signed operation(s)
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
 -t, --signed-operation <String>: JSON file of a signed operation (- for stdin)

Usage: ledger-live cleanSpeculos # clean all docker instance of speculos

Usage: ledger-live confirmOp  # Quickly verify if an operation id exists with our explorers (by synchronising the parent account)
     --id <String>            : operation id to search
 -f, --format <json | text>   : how to display the data

Usage: ledger-live countervalues # Get the balance history for accounts
 -c, --currency <String>      : ticker of a currency
 -C, --countervalue <String>  : ticker of a currency
 -p, --period <String>        : all | year | month | week | day
 -f, --format <stats | supportedFiats | default | json | asciichart>: how to display the data
 -v, --verbose
     --fiats                  : enable all fiats as countervalues
 -m, --marketcap <Number>     : use top N first tickers available in marketcap instead of having to specify each --currency
 -g, --disableAutofillGaps    : if set, disable the autofill of gaps to evaluate the rates availability
 -l, --latest                 : only fetch latest
 -d, --startDate <String>

Usage: ledger-live derivation

Usage: ledger-live devDeviceAppsScenario # dev feature to enter into a specific device apps scenario
 -d, --device <String>        : provide a specific HID path of a device
 -s, --scenario <String>      : nanos160-outdated-apps | nanos160-outdated-bitcoin-apps

Usage: ledger-live deviceAppVersion
 -d, --device <String>        : provide a specific HID path of a device

Usage: ledger-live deviceInfo
 -d, --device <String>        : provide a specific HID path of a device

Usage: ledger-live deviceSDKFirmwareUpdate # Perform a firmware update
 -d, --device <String>        : provide a specific HID path of a device
     --to-my-own-risk         : this is a developer feature that allow to flash anything, we are not responsible of your actions, by flashing your device you might reset your seed or block your device
     --osuVersion <String>    : (to your own risk) provide yourself an OSU version to flash the device with
     --listOSUs               : list all available OSUs (for all devices, beta and prod versions)

Usage: ledger-live deviceSDKGetDeviceInfo # Device SDK: get device info
 -d, --device <String>        : provide a specific HID path of a device

Usage: ledger-live deviceVersion
 -d, --device <String>        : provide a specific HID path of a device

Usage: ledger-live discoverDevices
 -m, --module <String>        : filter a specific module (either hid | ble)
 -i, --interactive            : interactive mode that accumulate the events instead of showing them

Usage: ledger-live envs       # Print available environment variables

Usage: ledger-live estimateMaxSpendable # estimate the max spendable of an account
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations

Usage: ledger-live exportAccounts # Export given accounts to Live QR or console for importing
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
 -o, --out                    : output to console

Usage: ledger-live firmwareRepair # Repair a firmware update
 -d, --device <String>        : provide a specific HID path of a device
     --forceMCU <String>      : force a mcu version to install

Usage: ledger-live firmwareUpdate # Perform a firmware update
 -d, --device <String>        : provide a specific HID path of a device
     --to-my-own-risk         : this is a developer feature that allow to flash anything, we are not responsible of your actions, by flashing your device you might reset your seed or block your device
     --osuVersion <String>    : (to your own risk) provide yourself an OSU version to flash the device with
     --listOSUs               : list all available OSUs (for all devices, beta and prod versions)

Usage: ledger-live generateTestScanAccounts # Generate a test for scan accounts (live-common dataset)
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
 -f, --format <operationBalanceHistoryBackwards | operationBalanceHistory | json | head | default | basic | full | stats | significantTokenTickers>: how to display the data

Usage: ledger-live generateTestTransaction # Generate a test for transaction (live-common dataset)
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
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
     --collection <String>    : collection of an NFT (in corelation with --tokenIds)
     --tokenIds <String>      : tokenId or list of tokenIds of an NFT separated by commas (order is kept in corelation with --quantities)
     --quantities <String>    : quantity or list of quantity of an ERC1155 NFT separated by commas (order is kept in corelation with --tokenIds)
     --mode <String>          : mode of transaction: send, optIn, claimReward
     --fees <String>          : how much fees
     --gasLimit <String>      : how much gasLimit. default is estimated with the recipient
     --memo <String>          : set a memo
 -t, --token <String>         : use an token account children of the account
     --feePerByte <String>    : how much fee per byte
 -E, --excludeUTXO <String>   : exclude utxo by their txhash@index (example: -E hash@3 -E hash@0)
     --rbf                    : enable replace-by-fee
     --bitcoin-pick-strategy <String>: utxo picking strategy, one of: DEEP_OUTPUTS_FIRST | OPTIMIZE_SIZE | MERGE_OUTPUTS
     --transactionIndex <String>: transaction index of a pending withdraw in case of withdraw mode
     --sourceValidator <String>: for redelegate, add a source validator
     --cosmosValidator <String>: address of recipient validator that will receive the delegate
     --cosmosAmountValidator <String>: Amount that the validator will receive
     --tokenId <String>       : determine the tokenId of an NFT (related to the --colection)
     --gasPrice <String>      : how much gasPrice. default is 2gwei. (example format: 2gwei, 0.000001eth, in wei if no unit precised)
     --nonce <String>         : set a nonce for this transaction
     --data <String>          : set the transaction data to use for signing the ETH transaction
     --fee <String>           : how much fee
     --tag <Number>           : ripple tag
     --solanaValidator <String>: validator address to delegate to
     --solanaStakeAccount <String>: stake account address to use in the transaction
     --memoType <String>      : stellar memo type
     --memoValue <String>     : stellar memo value
     --assetIssuer <String>   : Asset issuer
     --assetCode <String>     : Same as token
     --storageLimit <String>  : how much storageLimit. default is estimated with the recipient
     --subAccount <String>    : use a sub account instead of the parent by index
     --duration <String>      : duration in day
     --resource <String>      : reward ENERGY or BANDWIDTH
     --tronVoteAddress <String>: address of the super representative voting
     --tronVoteCount <String> : number of votes for the vote address
     --validator <String>     : address of recipient validator that will receive the delegate
     --era <String>           : Era of when to claim rewards
     --rewardDestination <String>: Reward destination

Usage: ledger-live genuineCheck # Perform a genuine check with Ledger's HSM
 -d, --device <String>        : provide a specific HID path of a device

Usage: ledger-live getAddress # Get an address with the device on specific derivations (advanced)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -d, --device <String>        : provide a specific HID path of a device
     --path <String>          : HDD derivation path
     --derivationMode <String>: derivationMode to use
 -v, --verify                 : also ask verification on device

Usage: ledger-live getBatteryStatus # Get the battery status of the current device
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -d, --device <String>        : provide a specific HID path of a device
     --p2 <String>            : What type of request to run (00-04)

Usage: ledger-live getDeviceRunningMode # Get the mode (bootloader, main, locked-device, disconnected-or-locked-device) in which the device is
 -r, --nbUnresponsiveRetry <Number>: Number of received CantOpenDevice errors while retrying before considering the device as maybe disconnected or cold-started-locked
 -t, --unresponsiveTimeoutMs <Number>: Time in ms of the timeout before considering the device unresponsive
 -d, --device <String>        : provide a specific HID path of a device

Usage: ledger-live getTransactionStatus # Prepare a transaction and returns 'TransactionStatus' meta information
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
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
     --collection <String>    : collection of an NFT (in corelation with --tokenIds)
     --tokenIds <String>      : tokenId or list of tokenIds of an NFT separated by commas (order is kept in corelation with --quantities)
     --quantities <String>    : quantity or list of quantity of an ERC1155 NFT separated by commas (order is kept in corelation with --tokenIds)
     --mode <String>          : mode of transaction: send, optIn, claimReward
     --fees <String>          : how much fees
     --gasLimit <String>      : how much gasLimit. default is estimated with the recipient
     --memo <String>          : set a memo
 -t, --token <String>         : use an token account children of the account
     --feePerByte <String>    : how much fee per byte
 -E, --excludeUTXO <String>   : exclude utxo by their txhash@index (example: -E hash@3 -E hash@0)
     --rbf                    : enable replace-by-fee
     --bitcoin-pick-strategy <String>: utxo picking strategy, one of: DEEP_OUTPUTS_FIRST | OPTIMIZE_SIZE | MERGE_OUTPUTS
     --transactionIndex <String>: transaction index of a pending withdraw in case of withdraw mode
     --sourceValidator <String>: for redelegate, add a source validator
     --cosmosValidator <String>: address of recipient validator that will receive the delegate
     --cosmosAmountValidator <String>: Amount that the validator will receive
     --tokenId <String>       : determine the tokenId of an NFT (related to the --colection)
     --gasPrice <String>      : how much gasPrice. default is 2gwei. (example format: 2gwei, 0.000001eth, in wei if no unit precised)
     --nonce <String>         : set a nonce for this transaction
     --data <String>          : set the transaction data to use for signing the ETH transaction
     --fee <String>           : how much fee
     --tag <Number>           : ripple tag
     --solanaValidator <String>: validator address to delegate to
     --solanaStakeAccount <String>: stake account address to use in the transaction
     --memoType <String>      : stellar memo type
     --memoValue <String>     : stellar memo value
     --assetIssuer <String>   : Asset issuer
     --assetCode <String>     : Same as token
     --storageLimit <String>  : how much storageLimit. default is estimated with the recipient
     --subAccount <String>    : use a sub account instead of the parent by index
     --duration <String>      : duration in day
     --resource <String>      : reward ENERGY or BANDWIDTH
     --tronVoteAddress <String>: address of the super representative voting
     --tronVoteCount <String> : number of votes for the vote address
     --validator <String>     : address of recipient validator that will receive the delegate
     --era <String>           : Era of when to claim rewards
     --rewardDestination <String>: Reward destination
 -f, --format <default | json>: how to display the data

Usage: ledger-live i18n       # Test e2e functionality for device localization support
 -d, --device <String>        : provide a specific HID path of a device
 -i, --install <String>       : install a language pack by its id
 -u, --uninstall <String>     : uninstall a language pack by its id

Usage: ledger-live liveData   # utility for Ledger Live app.json file
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
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
 -d, --device <String>        : provide a specific HID path of a device
 -f, --format <raw | json | default>

Usage: ledger-live portfolio  # Get a portfolio summary for accounts
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
     --countervalue <String>  : ticker of a currency
 -p, --period <String>        : all | year | month | week | day
 -g, --disableAutofillGaps    : if set, disable the autofill of gaps to evaluate the rates availability

Usage: ledger-live proxy
 -d, --device <String>        : provide a specific HID path of a device
 -f, --file <String>          : in combination with --record, will save all the proxied APDUs to a provided file. If --record is not provided, proxy will start in replay mode of the provided file. If --file is not used at all, the proxy will just act as a proxy without saving the APDU.
 -v, --verbose                : verbose mode
 -s, --silent                 : do not output the proxy logs
     --disable-auto-skip      : auto skip apdu that don't replay instead of error
 -p, --port <String>          : specify the http port to use (default: 8435)
 -r, --record                 : see the description of --file

Usage: ledger-live receive    # Receive crypto-assets (verify on device)
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
     --qr                     : also display a QR Code
     --freshAddressIndex <Number>: Change fresh address index

Usage: ledger-live repl       # Low level exchange with the device. Send APDUs from stdin.
 -d, --device <String>        : provide a specific HID path of a device
 -f, --file <filename>        : A file can also be provided. By default stdin is used.

Usage: ledger-live satstack   # SatStack: Generate and manage lss.json file
 -d, --device <String>        : provide a specific HID path of a device
     --no-device              : disable the scanning of device descriptors
     --no-save                : disable the save of the lss file
     --lss <filename>         : A file to save the sats stack state
     --rpcHOST <String>       : host to rpc full node (e.g. 127.0.0.1:8332)
     --rpcUSER <String>       : username of full node
     --rpcPASSWORD <String>   : password of full node
     --rpcTLS                 : use tls in full node

Usage: ledger-live satstackStatus # Check StackSats status
     --continuous             : enable status polling

Usage: ledger-live scanDescriptors # Synchronize accounts with blockchain
 -d, --device <String>        : provide a specific HID path of a device
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.

Usage: ledger-live send       # Send crypto-assets
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
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
     --collection <String>    : collection of an NFT (in corelation with --tokenIds)
     --tokenIds <String>      : tokenId or list of tokenIds of an NFT separated by commas (order is kept in corelation with --quantities)
     --quantities <String>    : quantity or list of quantity of an ERC1155 NFT separated by commas (order is kept in corelation with --tokenIds)
     --mode <String>          : mode of transaction: send, optIn, claimReward
     --fees <String>          : how much fees
     --gasLimit <String>      : how much gasLimit. default is estimated with the recipient
     --memo <String>          : set a memo
 -t, --token <String>         : use an token account children of the account
     --feePerByte <String>    : how much fee per byte
 -E, --excludeUTXO <String>   : exclude utxo by their txhash@index (example: -E hash@3 -E hash@0)
     --rbf                    : enable replace-by-fee
     --bitcoin-pick-strategy <String>: utxo picking strategy, one of: DEEP_OUTPUTS_FIRST | OPTIMIZE_SIZE | MERGE_OUTPUTS
     --transactionIndex <String>: transaction index of a pending withdraw in case of withdraw mode
     --sourceValidator <String>: for redelegate, add a source validator
     --cosmosValidator <String>: address of recipient validator that will receive the delegate
     --cosmosAmountValidator <String>: Amount that the validator will receive
     --tokenId <String>       : determine the tokenId of an NFT (related to the --colection)
     --gasPrice <String>      : how much gasPrice. default is 2gwei. (example format: 2gwei, 0.000001eth, in wei if no unit precised)
     --nonce <String>         : set a nonce for this transaction
     --data <String>          : set the transaction data to use for signing the ETH transaction
     --fee <String>           : how much fee
     --tag <Number>           : ripple tag
     --solanaValidator <String>: validator address to delegate to
     --solanaStakeAccount <String>: stake account address to use in the transaction
     --memoType <String>      : stellar memo type
     --memoValue <String>     : stellar memo value
     --assetIssuer <String>   : Asset issuer
     --assetCode <String>     : Same as token
     --storageLimit <String>  : how much storageLimit. default is estimated with the recipient
     --subAccount <String>    : use a sub account instead of the parent by index
     --duration <String>      : duration in day
     --resource <String>      : reward ENERGY or BANDWIDTH
     --tronVoteAddress <String>: address of the super representative voting
     --tronVoteCount <String> : number of votes for the vote address
     --validator <String>     : address of recipient validator that will receive the delegate
     --era <String>           : Era of when to claim rewards
     --rewardDestination <String>: Reward destination
     --ignore-errors          : when using multiple transactions, an error won't stop the flow
     --disable-broadcast      : do not broadcast the transaction
     --format <String>        : default | json | silent

Usage: ledger-live signMessage # Sign a message with the device on specific derivations (advanced)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
     --path <String>          : HDD derivation path
     --message <String>       : the message to sign
     --rawMessage <String>    : raw message to sign (used by walletconnect)
     --parser <String>        : parser used for the message. Default: String

Usage: ledger-live speculosList # list apps available for speculos

Usage: ledger-live staxFetchAndRestoreDemo # Conditionally backup, delete, and restore a custom image on Stax
 -d, --device <String>        : provide a specific HID path of a device
 -i, --fileInput <String>     : Text file containing the hex data of the image to load on Stax

Usage: ledger-live staxFetchImage # Test functionality lock screen customization on Stax for fetching an image
 -d, --device <String>        : provide a specific HID path of a device
 -o, --fileOutput <String>    : Output file path in case you want to save Hex string image

Usage: ledger-live staxFetchImageHash # Fetch the hash of the custom image
 -d, --device <String>        : provide a specific HID path of a device

Usage: ledger-live staxLoadImage # Test functionality lock screen customization on Stax for loading an image
 -d, --device <String>        : provide a specific HID path of a device
 -i, --fileInput <String>     : Text file containing the hex data of the image to load on Stax

Usage: ledger-live swap       # Perform an arbitrary swap between two currencies on the same seed
 -m, --mock                   : Whether or not to use the real backend or a mocked version
 -a, --amount <Number>        : Amount in satoshi units to send
 -u, --useAllAmount           : Attempt to send all using the emulated max amount calculation
 -w, --wyreUserId <String>    : If provided, will attempt to use Wyre provider with given userId
 -t, --tokenId <String>       : Use a token account children of the account
 -f, --useFloat               : Use first floating rate returned. Defaults to false.
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations

Usage: ledger-live sync       # Synchronize accounts with blockchain
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
 -f, --format <operationBalanceHistoryBackwards | operationBalanceHistory | json | head | default | basic | full | stats | significantTokenTickers>: how to display the data

Usage: ledger-live synchronousOnboarding # track the onboarding status of your device
 -p, --pollingPeriodMs <Number>: polling period in milliseconds
 -d, --device <String>        : provide a specific HID path of a device

Usage: ledger-live testDetectOpCollision # Detect operation collisions
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations

Usage: ledger-live testGetTrustedInputFromTxHash
 -d, --device <String>        : provide a specific HID path of a device
 -c, --currency <String>
 -h, --hash <String>

Usage: ledger-live user

Usage: ledger-live version

Usage: ledger-live walletconnect # Create a walletconnect session
 -d, --device <String>        : provide a specific HID path of a device
     --xpub <String>          : use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]
     --id <String>            : restore an account id (or a partial version of an id) (alternatively to --device)
     --file <filename>        : use a JSON account file or '-' for stdin (alternatively to --device)
     --appjsonFile <filename> : use a desktop app.json (alternatively to --device)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -s, --scheme <String>        : if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.
 -i, --index <Number>         : select the account by index
 -l, --length <Number>        : set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.
     --paginateOperations <Number>: if defined, will paginate operations
     --walletConnectURI <String>: WallecConnect URI to use.
     --walletConnectSession <String>: WallecConnect Session to use.
 -v, --verbose                : verbose mode
     --silent                 : do not output the proxy logs


                ````
           `.--:::::
        `.-:::::::::       ````
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

`````
