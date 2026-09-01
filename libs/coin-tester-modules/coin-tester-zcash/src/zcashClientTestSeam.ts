/**
 * Test seam that captures the PCZT hex a build job produces, without any
 * `@ledgerhq/coin-zcash` source change.
 *
 * `coin-zcash`'s `logic/engineClient.ts` resolves its native client lazily via
 * a package-name dynamic import (`import("@ledgerhq/coin-zcash/network/ZCash")`),
 * specifically so the Electron renderer's build can alias it to the IPC client
 * instead. Jest resolves that same specifier through its own module registry,
 * so `jest.mock("@ledgerhq/coin-zcash/network/ZCash", () =>
 * require("./zcashClientTestSeam"))` (see scenarii.test.ts) intercepts it there
 * too -- this module IS the mock's factory result.
 *
 * `createZCashClient` here re-assembles the exact same dependency set the real
 * module's `createZCashClient` wires up (`network/ZCash.ts`'s private
 * `defaultDeps`, rebuilt from `network/engine.ts`'s individual exports, since
 * `defaultDeps` itself isn't exported), with the two build jobs wrapped to
 * record their `pcztHex` before returning the result unchanged. Every other
 * job (`getChainTipJob`, `startSyncJob`, `finalizeTransactionJob`,
 * `broadcastTransactionJob`, `transactionDetailsJob`, `deriveShieldedAddress`,
 * ...) is passed through untouched -- this is the real, unmocked engine
 * hitting the real, local zaino gRPC endpoint.
 */
import type { ZCashClient, ZCashClientArgs } from "@ledgerhq/coin-zcash/network/types";
import type {
  BuildIronwoodTransactionArgs,
  BuildIronwoodTransactionResult,
  BuildTransactionArgs,
  BuildTransactionResult,
} from "@ledgerhq/coin-zcash/network/types";
import type { ZCashClientDeps } from "@ledgerhq/coin-zcash/network/ZCash";
import { toRegtestAddress } from "./regtestAddress";

// The pinned catalog @ledgerhq/zcash-utils only added regtest network support
// (LIVE-36479) after this seam was first written; both build jobs now force
// `network: "regtest"` (instead of forwarding whatever coin-zcash's own
// getZainoEndpoint() resolved -- see scenarii/zcash.ts, which deliberately
// keeps that at "mainnet" for the *sync* path, which does not accept
// "regtest" -- see network.rs's parse_network vs parse_any_network) so the
// native builder's NU5/NU6.3 activation-height gate is satisfiable at all
// against a real regtest chain, and re-encode every recipient address from
// coin-zcash's mainnet-only encoding into its regtest equivalent (see
// regtestAddress.ts for why both changes are necessary, verified against the
// real native addon).
const BUILD_NETWORK = "regtest";

type ZCashNetworkModule = typeof import("@ledgerhq/coin-zcash/network/ZCash");
type ZCashEngineModule = typeof import("@ledgerhq/coin-zcash/network/engine");
type ZCashRehydrateModule = typeof import("@ledgerhq/coin-zcash/network/serialization/rehydrate");
type ZCashSyncEstimatorModule = typeof import("@ledgerhq/coin-zcash/network/sync-estimator");

const actualZCash = jest.requireActual<ZCashNetworkModule>("@ledgerhq/coin-zcash/network/ZCash");
const engine = jest.requireActual<ZCashEngineModule>("@ledgerhq/coin-zcash/network/engine");
const { rehydrateSyncResult } = jest.requireActual<ZCashRehydrateModule>(
  "@ledgerhq/coin-zcash/network/serialization/rehydrate",
);
const { createSyncTimeEstimator } = jest.requireActual<ZCashSyncEstimatorModule>(
  "@ledgerhq/coin-zcash/network/sync-estimator",
);

/**
 * Last PCZT hex a build job produced, keyed by account index. `signer.ts`'s
 * `signPcztTransaction` looks this up to recover the exact bytes it is being
 * asked to sign (the PcztTransaction the signer receives is the *parsed*
 * structure -- the hex form `testSignPczt` needs is only available here,
 * where the raw build result is still in hand).
 */
const capturedPcztHexByAccount = new Map<number, string>();

export function getCapturedPcztHex(accountIndex: number): string {
  const hex = capturedPcztHexByAccount.get(accountIndex);
  if (!hex) {
    throw new Error(
      `No PCZT hex captured yet for account ${accountIndex} -- craftTransaction/craftIronwoodTransaction must run before signPcztTransaction`,
    );
  }
  return hex;
}

async function recordingBuildTransactionJob(
  args: Omit<BuildTransactionArgs, "requestId">,
): Promise<BuildTransactionResult> {
  const regtestArgs: Omit<BuildTransactionArgs, "requestId"> = {
    ...args,
    network: BUILD_NETWORK,
    outputs: args.outputs.map(output => ({ ...output, address: toRegtestAddress(output.address) })),
  };
  const built = await engine.buildTransactionJob(regtestArgs);
  capturedPcztHexByAccount.set(args.accountIndex, built.pcztHex);
  return built;
}

async function recordingBuildIronwoodTransactionJob(
  args: Omit<BuildIronwoodTransactionArgs, "requestId">,
): Promise<BuildIronwoodTransactionResult> {
  const regtestArgs: Omit<BuildIronwoodTransactionArgs, "requestId"> = {
    ...args,
    network: BUILD_NETWORK,
    outputs: args.outputs.map(output => ({ ...output, address: toRegtestAddress(output.address) })),
  };
  const built = await engine.buildIronwoodTransactionJob(regtestArgs);
  capturedPcztHexByAccount.set(args.accountIndex, built.pcztHex);
  return built;
}

const deps: ZCashClientDeps = {
  getChainTipJob: engine.getChainTipJob,
  findBlockHeightJob: engine.findBlockHeightJob,
  validateStartSyncArgs: engine.validateStartSyncArgs,
  startSyncJob: engine.startSyncJob,
  rehydrateSyncResult,
  createSyncTimeEstimator,
  buildTransactionJob: recordingBuildTransactionJob,
  buildIronwoodTransactionJob: recordingBuildIronwoodTransactionJob,
  finalizeTransactionJob: engine.finalizeTransactionJob,
  broadcastTransactionJob: engine.broadcastTransactionJob,
  transactionDetailsJob: engine.transactionDetailsJob,
  deriveShieldedAddress: engine.deriveShieldedAddress,
};

export function createZCashClient(args: ZCashClientArgs): ZCashClient {
  return actualZCash.createZCashClientWith(deps, args);
}

export const createZCashClientWith = actualZCash.createZCashClientWith;
