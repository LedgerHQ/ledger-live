import { CloudSyncSDKInterface } from "../../cloudsync";
import { z } from "zod";
import { Observable, never } from "rxjs";
import { WalletSyncDataManager } from "../types";
import { Trustchain, MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { CreateWalletSyncWatchLoopParams } from "../createWalletSyncWatchLoop";

export const getWalletSyncWatchLoopConfig = () => {
  const schema = z.number();
  type Data = number;

  const walletsync: WalletSyncDataManager<number, number, typeof schema> = {
    schema,
    diffLocalToDistant(local, latest) {
      return { hasChanges: local !== (latest || 0), nextState: local };
    },
    async resolveIncrementalUpdate(_ctx, local, latest, incoming) {
      if (incoming === latest || !incoming) {
        return { hasChanges: false };
      }
      return {
        hasChanges: true,
        update: incoming,
      };
    },
    applyUpdate(_local, update) {
      return update;
    },
  };

  const trustchain = {
    rootId: "",
    applicationPath: "",
    walletSyncEncryptionKey: "",
  };

  const memberCredentials = {
    pubkey: "",
    privatekey: "",
  };

  const localIncrementUpdate = jest.fn();

  const walletSyncSdk: CloudSyncSDKInterface<Data> = {
    pull: jest.fn().mockResolvedValue(undefined),
    push: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    listenNotifications(
      _trustchain: Trustchain,
      _memberCredentials: MemberCredentials,
    ): Observable<number> {
      return never();
    },
  };

  const getState = jest.fn().mockReturnValue(null);
  const localStateSelector = jest.fn().mockReturnValue(0);
  const latestDistantStateSelector = jest.fn().mockReturnValue(null);
  const onTrustchainRefreshNeeded = jest.fn();

  const walletSyncWatchLoopConfig: CreateWalletSyncWatchLoopParams<
    number,
    number,
    number,
    typeof schema
  > = {
    walletsync,
    walletSyncSdk,
    trustchain,
    memberCredentials,
    getState,
    localStateSelector,
    latestDistantStateSelector,
    onTrustchainRefreshNeeded,
    localIncrementUpdate,
  };

  return walletSyncWatchLoopConfig;
};

/**
 * workaround on Jest advanceTimersByTime to awaits promises that arises inside setTimeouts
 * see https://stackoverflow.com/questions/51126786/jest-fake-timers-with-promises
 */
export async function advanceTimersByTimeAsync(seconds: number) {
  const timeIncrement = 1000;
  for (let t = 0; t < 1000 * seconds; t += timeIncrement) {
    jest.advanceTimersByTime(timeIncrement);
    await Promise.resolve();
  }
}
