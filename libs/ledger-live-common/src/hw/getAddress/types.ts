import Transport from "@ledgerhq/hw-transport";
import { GetAddressOptions, Result } from "@ledgerhq/coin-framework/derivation";

export { GetAddressOptions, Result };

export type Resolver = (transport: Transport, addressOpt: GetAddressOptions) => Promise<Result>;
