For more information about writing a new module, please this follow tutorial: https://ledgerhq.atlassian.net/wiki/spaces/WXP/pages/4862509091/TODO+how+to+develop+a+new+WalletSync+module

### Template for a new module

```ts
import { WalletSyncDataManager } from "../types";
import { z } from "zod";

// schema of the distant data. IMPORTANT: Once the module is written, the schema must not change over time – if you still want to change the schema, only do it by adding optional fields and make sure that any module implementation (from v1) was keeping the unknown properties = the schema must be backward compatible.
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
    // if incoming state is null, it means the data is no longer available
    if (!incomingState) {
      return { hasChanges: false };
    }

    // this module don't need to manage any "local increment update" so we must bail out from doing anything during localIncrementalUpdate() step
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
