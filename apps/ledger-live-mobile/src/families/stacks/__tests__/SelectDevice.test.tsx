import React from "react";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { fetchPoxInfo } from "@ledgerhq/live-common/families/stacks/react";
import type { Transaction } from "@ledgerhq/live-common/families/stacks/types";
import { ScreenName } from "~/const";
import StakingSelectDevice from "../StakingFlow/SelectDevice";
import { mockBridge } from "../__mocks__/bridge.mock";
import { POOL_ADDRESS } from "../__mocks__/account.mock";

jest.mock("@ledgerhq/live-common/families/stacks/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/stacks/react"),
  fetchPoxInfo: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true,
}));

// The shared screen forwards its route params to ConnectDevice; render them to observe that.
jest.mock("~/screens/SelectDevice", () => ({
  __esModule: true,
  default: ({ route }: { route: { params: { transaction: Transaction } } }) => {
    const { Text: RNText } = jest.requireActual("react-native");
    return (
      <RNText testID="shared-select-device">
        {String(route.params.transaction.familySpecificData?.startBurnHt)}
      </RNText>
    );
  },
}));

const mockFetchPoxInfo = jest.mocked(fetchPoxInfo);
const poxInfo = (height: number) =>
  ({ current_burnchain_block_height: height }) as Awaited<ReturnType<typeof fetchPoxInfo>>;

const transaction = mockBridge.updateTransaction(mockBridge.createTransaction(), {
  mode: "delegate",
  valAddress: POOL_ADDRESS,
  familySpecificData: { numCycles: 6, startBurnHt: 900_000 },
});

const setParams = jest.fn();

const renderScreen = () =>
  render(
    <StakingSelectDevice
      navigation={{ setParams } as never}
      route={
        {
          name: ScreenName.StacksStakingSelectDevice,
          params: { accountId: "stacks-account", transaction },
        } as never
      }
    />,
  );

describe("Stacks staking SelectDevice", () => {
  beforeEach(() => {
    setParams.mockReset();
    mockFetchPoxInfo.mockReset();
  });

  it("keeps refreshing startBurnHt in the params handed to ConnectDevice", async () => {
    mockFetchPoxInfo.mockResolvedValue(poxInfo(900_456));
    renderScreen();

    expect(screen.getByTestId("shared-select-device")).toHaveTextContent("900000");
    await waitFor(() =>
      expect(setParams).toHaveBeenCalledWith({
        transaction: expect.objectContaining({
          mode: "delegate",
          familySpecificData: { numCycles: 6, startBurnHt: 900_456 },
        }),
      }),
    );
  });

  it("replaces the device list with a retry when the height can't be refreshed", async () => {
    mockFetchPoxInfo.mockRejectedValueOnce(new Error("pox unavailable"));
    renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId("stacks-stake-select-device-pox-error")).toBeVisible(),
    );
    expect(screen.queryByTestId("shared-select-device")).toBeNull();

    mockFetchPoxInfo.mockResolvedValueOnce(poxInfo(900_789));
    fireEvent.press(screen.getByTestId("stacks-stake-select-device-pox-retry"));

    await waitFor(() => expect(screen.getByTestId("shared-select-device")).toBeVisible());
    expect(setParams).toHaveBeenCalledWith({
      transaction: expect.objectContaining({
        familySpecificData: { numCycles: 6, startBurnHt: 900_789 },
      }),
    });
  });
});
