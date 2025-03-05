import Transport from "@ledgerhq/hw-transport";
import type { GetAddressOptions, Result } from "@ledgerhq/coin-framework/derivation";

export type { GetAddressOptions, Result };

export type Resolver = (transport: Transport, addressOpt: GetAddressOptions) => Promise<Result>;
