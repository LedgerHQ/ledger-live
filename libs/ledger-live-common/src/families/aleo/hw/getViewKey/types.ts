import type Transport from "@ledgerhq/hw-transport";
import type { GetViewKeyResult, GetViewKeyOptions } from "@ledgerhq/coin-aleo/signer/getViewKey";

export { GetViewKeyResult, GetViewKeyOptions };

export type Resolver = (transport: Transport, opts: GetViewKeyOptions) => Promise<GetViewKeyResult>;
