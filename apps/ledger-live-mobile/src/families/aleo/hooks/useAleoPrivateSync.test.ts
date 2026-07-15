import { renderHook } from "@testing-library/react-native";
import { useIsFocused } from "@react-navigation/native";
import { useAleoPrivateSync as useAleoPrivateSyncCore } from "@ledgerhq/live-common/families/aleo/react";
import { accountSelector } from "~/reducers/accounts";
import { updateAccountWithUpdater } from "~/actions/accounts";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import { useAleoPrivateSync } from "./useAleoPrivateSync";

jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  useAleoPrivateSync: jest.fn(),
}));
jest.mock("~/reducers/accounts", () => ({
  ...jest.requireActual("~/reducers/accounts"),
  accountSelector: jest.fn(),
}));
jest.mock("~/actions/accounts", () => ({
  ...jest.requireActual("~/actions/accounts"),
  updateAccountWithUpdater: jest.fn(),
}));
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: jest.fn(),
}));

const mockCore = jest.mocked(useAleoPrivateSyncCore);
const mockAccountSelector = jest.mocked(accountSelector);
const mockUpdateAccountWithUpdater = jest.mocked(updateAccountWithUpdater);
const mockUseIsFocused = jest.mocked(useIsFocused);

describe("useAleoPrivateSync (mobile wrapper)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCore.mockReturnValue({
      isSyncing: false,
      progress: 0,
      error: null,
      start: jest.fn(),
      stop: jest.fn(),
    });
    mockUseIsFocused.mockReturnValue(true);
  });

  it("delegates to the live-common core hook with the given options", () => {
    const onAccountUpdated = jest.fn();
    renderHook(() =>
      useAleoPrivateSync({
        account: ALEO_ACCOUNT_1,
        autoStart: true,
        keepAliveOnUnmount: true,
        onAccountUpdated,
      }),
    );

    expect(mockCore).toHaveBeenCalledTimes(1);
    const call = mockCore.mock.calls[0][0];
    expect(call.account).toBe(ALEO_ACCOUNT_1);
    expect(call.autoStart).toBe(true);
    expect(call.keepAliveOnUnmount).toBe(true);
    expect(call.onAccountUpdated).toBe(onAccountUpdated);
  });

  it("ANDs autoStart with screen focus, so a mounted-but-unfocused screen doesn't start syncing", () => {
    mockUseIsFocused.mockReturnValue(false);
    renderHook(() => useAleoPrivateSync({ account: ALEO_ACCOUNT_1, autoStart: true }));

    const call = mockCore.mock.calls[0][0];
    expect(call.autoStart).toBe(false);
  });

  it("keeps autoStart false when the caller opts out, regardless of focus", () => {
    renderHook(() => useAleoPrivateSync({ account: ALEO_ACCOUNT_1, autoStart: false }));

    const call = mockCore.mock.calls[0][0];
    expect(call.autoStart).toBe(false);
  });

  it("wires accountSelector through to the app's real selector", () => {
    renderHook(() => useAleoPrivateSync({ account: ALEO_ACCOUNT_1 }));

    const call = mockCore.mock.calls[0][0];
    const state = { accounts: [ALEO_ACCOUNT_1] };
    call.accountSelector(state, { accountId: ALEO_ACCOUNT_1.id });

    expect(mockAccountSelector).toHaveBeenCalledWith(state, { accountId: ALEO_ACCOUNT_1.id });
  });

  it("wires updateAccountWithUpdater through to the app's real action creator", () => {
    renderHook(() => useAleoPrivateSync({ account: ALEO_ACCOUNT_1 }));

    const call = mockCore.mock.calls[0][0];
    const updater = (a: typeof ALEO_ACCOUNT_1) => a;
    call.updateAccountWithUpdater(ALEO_ACCOUNT_1.id, updater);

    expect(mockUpdateAccountWithUpdater).toHaveBeenCalledWith({
      accountId: ALEO_ACCOUNT_1.id,
      updater,
    });
  });
});
