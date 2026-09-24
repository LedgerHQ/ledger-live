import { renderHook } from "@tests/test-renderer";
import { useIsFocused } from "@react-navigation/native";
import {
  useAleoUnbondingState,
  type AleoStakingPositionView,
} from "@ledgerhq/live-common/families/aleo/react";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import { ALEO_ACCOUNT_1 } from "../../__mocks__/account.mock";
import { useUnbondingState } from "../useUnbondingState";

jest.mock("@ledgerhq/live-common/families/aleo/react", () => ({
  useAleoUnbondingState: jest.fn(),
}));

jest.mock("~/components/useIsAppInBackground", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: jest.fn(() => true),
}));

const mockShared = jest.mocked(useAleoUnbondingState);

const account = ALEO_ACCOUNT_1 as AleoAccount;
const position = {} as AleoStakingPositionView;

describe("useUnbondingState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useIsAppInBackground).mockReturnValue(false);
    jest.mocked(useIsFocused).mockReturnValue(true);
  });

  const render = () => renderHook(() => useUnbondingState(account, position));

  it("leaves the poll running while the app is active and the screen focused", () => {
    render();

    expect(mockShared).toHaveBeenCalledTimes(1);
    expect(mockShared).toHaveBeenCalledWith(account, position, { paused: false });
  });

  it("pauses the poll while the app is in the background", () => {
    jest.mocked(useIsAppInBackground).mockReturnValue(true);

    render();

    expect(mockShared).toHaveBeenCalledTimes(1);
    expect(mockShared).toHaveBeenCalledWith(account, position, { paused: true });
  });

  it("pauses the poll while the screen is not focused", () => {
    jest.mocked(useIsFocused).mockReturnValue(false);

    render();

    expect(mockShared).toHaveBeenCalledTimes(1);
    expect(mockShared).toHaveBeenCalledWith(account, position, { paused: true });
  });
});
