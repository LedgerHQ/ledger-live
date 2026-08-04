import { z } from "zod";
import { never } from "rxjs";
import { TrustchainEjected, TrustchainOutdated } from "@ledgerhq/ledger-key-ring-protocol/errors";
import {
  createWalletSyncWatchLoop,
  CreateWalletSyncWatchLoopParams,
} from "./createWalletSyncWatchLoop";
import { WalletSyncDataManager } from "./types";

jest.useFakeTimers();

// the loop itself is covered by @features/platform-wallet-sync; what is specific here is
// that a legacy ctx-carrying manager is accepted and that the lkrp errors are the ones
// recognized as "the trustchain must be refreshed".
function getConfig(): CreateWalletSyncWatchLoopParams<number, number, number, z.ZodNumber> {
  const schema = z.number();
  const walletsync: WalletSyncDataManager<number, number, typeof schema> = {
    schema,
    diffLocalToDistant: (local, latest) => ({
      hasChanges: local !== (latest || 0),
      nextState: local,
    }),
    resolveIncrementalUpdate: async (_ctx, _local, latest, incoming) =>
      incoming === latest || !incoming
        ? { hasChanges: false }
        : { hasChanges: true, update: incoming },
    applyUpdate: (_local, update) => update,
  };

  return {
    walletsync,
    walletSyncSdk: {
      pull: jest.fn().mockResolvedValue(undefined),
      push: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn().mockResolvedValue(undefined),
      listenNotifications: () => never(),
    },
    trustchain: { rootId: "", applicationPath: "", walletSyncEncryptionKey: "" },
    memberCredentials: { pubkey: "", privatekey: "" },
    getState: jest.fn().mockReturnValue(null),
    localStateSelector: jest.fn().mockReturnValue(0),
    latestDistantStateSelector: jest.fn().mockReturnValue(null),
    onTrustchainRefreshNeeded: jest.fn(),
    localIncrementUpdate: jest.fn(),
  };
}

async function advanceTimersByTimeAsync(seconds: number) {
  for (let t = 0; t < 1000 * seconds; t += 1000) {
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
  }
}

describe("createWalletSyncWatchLoop", () => {
  it.each([new TrustchainEjected("error"), new TrustchainOutdated("error")])(
    "refreshes the trustchain on %s instead of reporting an error",
    async error => {
      const config = getConfig();
      config.onStartPolling = () => {
        throw error;
      };
      const onError = jest.fn();
      config.onError = onError;

      const watchLoop = createWalletSyncWatchLoop(config);
      await advanceTimersByTimeAsync(5);

      expect(config.onTrustchainRefreshNeeded).toHaveBeenCalledTimes(1);
      expect(onError).not.toHaveBeenCalled();

      watchLoop.unsubscribe();
    },
  );
});
