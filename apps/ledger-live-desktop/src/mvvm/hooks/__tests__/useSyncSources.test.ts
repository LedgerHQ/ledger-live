import { renderHook } from "tests/testSetup";
import { useSyncSources } from "../useSyncSources";
import * as liveCommon from "@ledgerhq/live-common/bridge/react/index";
import * as walletSyncContext from "LLD/features/WalletSync/components/WalletSyncContext";
import { defaultWalletSyncReturn } from "./fixtures";

jest.mock("@ledgerhq/live-common/bridge/react/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/bridge/react/index"),
  useSyncSources: jest.fn(),
}));

jest.mock("LLD/features/WalletSync/components/WalletSyncContext", () => ({
  useWalletSyncUserState: jest.fn(),
}));

const mockUseSyncSourcesCommon = jest.mocked(liveCommon.useSyncSources);
const mockUseWalletSyncUserState = jest.mocked(walletSyncContext.useWalletSyncUserState);

const fakeSyncSourcesReturn: liveCommon.SyncSourcesState = {
  isPending: false,
  stablePending: false,
  hasCvOrBridgeError: false,
  hasWalletSyncError: false,
  triggerRefresh: jest.fn(),
};

describe("useSyncSources (desktop wrapper)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWalletSyncUserState.mockReturnValue(defaultWalletSyncReturn);
    mockUseSyncSourcesCommon.mockReturnValue(fakeSyncSourcesReturn);
  });

  it("should pass wallet sync state to common useSyncSources", () => {
    renderHook(() => useSyncSources());

    expect(mockUseSyncSourcesCommon).toHaveBeenCalledWith(defaultWalletSyncReturn);
  });

  it("should return the result from common useSyncSources", () => {
    const customReturn = { ...fakeSyncSourcesReturn, isPending: true };
    mockUseSyncSourcesCommon.mockReturnValue(customReturn);

    const { result } = renderHook(() => useSyncSources());

    expect(result.current).toBe(customReturn);
  });
});
