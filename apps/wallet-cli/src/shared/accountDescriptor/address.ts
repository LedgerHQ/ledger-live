import { addressFromKey } from "@ledgerhq/live-common/account/accountDescriptor";
import type { Address } from "@domain/entity-account-descriptor";
import type { AccountBasedDescriptorV1 } from "./v1";
import { currencyIdFromNetwork } from "./network";

/** The address an account-based descriptor is read at: its key, or the address its family computes from its public key. */
export const addressOfV1 = (v1: AccountBasedDescriptorV1): Promise<Address> =>
  addressFromKey(currencyIdFromNetwork(v1.network), v1.key);
