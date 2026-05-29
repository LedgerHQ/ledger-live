# WalletSync Modules

This directory contains WalletSync module implementations. For broader design
context, see the internal
[WalletSync module tutorial](https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4862509091/TODO+how+to+develop+a+new+WalletSync+module).

## New Module Template

```ts
import { WalletSyncDataManager } from "../types";
import { z } from "zod";

// Schema of the distant data. Once a module ships, keep the schema backward
// compatible: add optional fields instead of changing existing fields.
const schema = z.record(z.string());

const manager: WalletSyncDataManager<
  {
    // describe the signature of your LocalState here
  },
  {
    // describe the signature of your Update here
  },
  typeof schema
> = {
  schema,

  diffLocalToDistant(localData, latestState) {
    const nextState = (void localData, latestState || {}); // replace with your implementation.
    const hasChanges = false; // replace with your implementation.
    return {
      hasChanges,
      nextState,
    };
  },

  async resolveIncrementalUpdate(_ctx, localData, latestState, incomingState) {
    // If incoming state is null, the data is no longer available.
    if (!incomingState) {
      return { hasChanges: false };
    }

    // Bail out if the module does not need to process a local incremental
    // update.
    if (latestState === incomingState) {
      return { hasChanges: false };
    }

    // let hasChanges = false;
    // if (!hasChanges) {
    //   return { hasChanges: false };
    // }

    const update = {
      // have your update here
    };
    return Promise.resolve({ hasChanges: true, update });
  },

  applyUpdate(localData, update) {
    const data = (void update, localData); // replace with your implementation
    return data;
  },
};

export default manager;
```
