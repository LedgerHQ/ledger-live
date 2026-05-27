import Transport from "@ledgerhq/hw-transport";
import type {
  GetAddressOptions,
  GetAddressResult,
} from "@ledgerhq/ledger-wallet-framework/derivation";

export type { GetAddressOptions, GetAddressResult };

export type Resolver = (
  transport: Transport,
  addressOpt: GetAddressOptions,
) => Promise<GetAddressResult>;
