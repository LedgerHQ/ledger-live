import React from "react";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  BridgeSyncContext,
  BridgeSyncStateContext,
} from "@ledgerhq/live-common/bridge/react/context";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { ShownStakePosition, ShownStakePositionRequest } from "@features/flow-stake-position";
import { renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { useStakePositionRequestSheetViewModel } from "../useStakePositionRequestSheetViewModel";

// The stake flow of a wallet screen navigates to the Base stack, which no test here mounts.
jest.mock("~/components/Stake/useStakingDrawer", () => ({ useStakingDrawer: () => jest.fn() }));

const mockSync = jest.fn();

const solana = getCryptoCurrencyById("solana");
const STAKE_ACCOUNT = "FakeStake111111111111111111111111111111111";

function renderSheetOf(phase: ShownStakePosition["phase"], syncedSecondsAgo: number) {
  const account = {
    ...genAccount("stake-position-request-sheet", { currency: solana, operationsSize: 0 }),
    lastSyncDate: new Date(Date.now() - syncedSecondsAgo * 1000),
  };
  const request: ShownStakePositionRequest = {
    id: 1,
    origin: "earn",
    accountId: account.id,
    positionId: STAKE_ACCOUNT,
  };
  const view = renderHook(() => useStakePositionRequestSheetViewModel({ request, phase }), {
    overrideInitialState: (state: State): State => ({
      ...state,
      accounts: { ...state.accounts, active: [account] },
    }),
    innerWrapper: ({ children }) => (
      <BridgeSyncContext.Provider value={mockSync}>
        <BridgeSyncStateContext.Provider value={{}}>{children}</BridgeSyncStateContext.Provider>
      </BridgeSyncContext.Provider>
    ),
  });
  return { ...view, account };
}

describe("useStakePositionRequestSheetViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("a request that is not signed yet", () => {
    it.each(["open", "signing"] as const)(
      "should sync the outdated account once, and wait for it, when the request is %s",
      phase => {
        const { result, account } = renderSheetOf(phase, 120);

        expect(mockSync).toHaveBeenCalledTimes(1);
        expect(mockSync).toHaveBeenCalledWith({
          type: "SYNC_ONE_ACCOUNT",
          accountId: account.id,
          priority: 10,
          reason: "stake-position-open",
        });
        expect(result.current.isSyncing).toBe(true);
      },
    );

    it.each(["open", "signing"] as const)(
      "should not sync an account synced moments ago when the request is %s",
      phase => {
        const { result } = renderSheetOf(phase, 10);

        expect(mockSync).not.toHaveBeenCalled();
        expect(result.current.isSyncing).toBe(false);
      },
    );
  });

  describe("a request that is signed or closed", () => {
    it.each(["committed", "settled", "closed"] as const)(
      "should leave the outdated account alone when the request is %s",
      phase => {
        const { result } = renderSheetOf(phase, 120);

        expect(mockSync).not.toHaveBeenCalled();
        expect(result.current.isSyncing).toBe(false);
      },
    );
  });
});
