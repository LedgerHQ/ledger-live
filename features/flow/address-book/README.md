# Address Book

Shared Address Book feature package for Ledger Wallet.

## What is included

- EVM Address Book device intent contracts.
- Dummy jobs that do not talk to a device and always complete successfully.
- Simple `.native` and `.web` intent components for integration scaffolding.

## Usage

```ts
import {
  registerAddressBookExternalAddressEvmIntentPlatformDefinition,
  type RegisterAddressBookExternalAddressEvmIntentInput,
} from "@features/flow-address-book";
```

The package only exposes reusable definitions. App-level screens decide where
and how to mount the Device Intent Executor.
