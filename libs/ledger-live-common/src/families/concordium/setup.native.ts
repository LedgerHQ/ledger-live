import type { ConcordiumSigner } from "@ledgerhq/coin-concordium";
import concordiumResolver from "@ledgerhq/coin-concordium/signer";
import type {
  ConcordiumAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/coin-concordium/types";
import Concordium from "@ledgerhq/hw-app-concordium";
import type Transport from "@ledgerhq/hw-transport";
import type { Bridge } from "@ledgerhq/types-live";
import type { CreateSigner } from "../../bridge/setup";
import { createResolver } from "../../bridge/setup";
import type { Resolver } from "../../hw/getAddress/types";

const createSigner: CreateSigner<ConcordiumSigner> = (transport: Transport): ConcordiumSigner => {
  return new Concordium(transport);
};

// Bridge operations (sync, broadcast) require a direct gRPC connection to a Concordium
// node, which is not available in React Native. The stub satisfies the type contract
// so the mobile bundle compiles; runtime calls will error when concordium is unsupported.
// This will be resolved once a mobile-compatible bridge is implemented in future work.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bridge: Bridge<Transaction, ConcordiumAccount, TransactionStatus> = {} as any;

const resolver: Resolver = createResolver(createSigner, concordiumResolver);

export { bridge, resolver };
