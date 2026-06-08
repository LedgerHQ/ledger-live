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

Usage: ledger-live botTransfer # transfer funds from one seed (SEED) to another (SEED_RECIPIENT)

Usage: ledger-live getAddress # Get an address with the device on specific derivations (advanced)
 -c, --currency <String>      : Currency name or ticker. If not provided, it will be inferred from the device.
 -d, --device <String>        : provide a specific HID path of a device
     --path <String>          : HDD derivation path
     --derivationMode <String>: derivationMode to use
 -v, --verify                 : also ask verification on device

Usage: ledger-live send       # Send crypto-assets (used by e2e for token transfer / approval flows)
 -c, --currency <String>      : Currency name or ticker
 -i, --index <Number>         : select the account by index
     --mode <String>          : transaction mode (e.g. send, erc20.approve)
     --recipient <String>     : recipient address
     --amount <String>        : amount to send
     --token <String>         : token contract / id
     --spender <String>       : spender address (token approval)
     --wait-confirmation      : wait for the transaction confirmation
 -f, --format <String>        : how to display the data

Usage: ledger-live tokenAllowance # check ERC-20 token approval status (allowance) for an EVM account (used by e2e)
 -c, --currency <String>      : Currency name or ticker
 -i, --index <Number>         : select the account by index
     --token <String>         : token contract / id
     --spender <String>       : spender address
     --ownerAddress <String>  : owner address
 -f, --format <json | default>: how to display the data

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

Usage: ledger-live proxy
 -d, --device <String>        : provide a specific HID path of a device
 -f, --file <String>          : in combination with --record, will save all the proxied APDUs to a provided file. If --record is not provided, proxy will start in replay mode of the provided file. If --file is not used at all, the proxy will just act as a proxy without saving the APDU.
 -v, --verbose                : verbose mode
 -s, --silent                 : do not output the proxy logs
     --disable-auto-skip      : auto skip apdu that don't replay instead of error
 -p, --port <String>          : specify the http port to use (default: 8435)
 -r, --record                 : see the description of --file

Usage: ledger-live version



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
