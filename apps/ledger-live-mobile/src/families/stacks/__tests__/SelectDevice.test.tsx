import React, { useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { fetchPoxInfo } from "@ledgerhq/live-common/families/stacks/react";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/stacks/types";
import { ScreenName } from "~/const";
import StakingSelectDevice from "../StakingFlow/SelectDevice";
import {
  bridgeState,
  DEFAULT_STATUS,
  mockBridge,
  resetBridgeState,
} from "../__mocks__/bridge.mock";
import { makeStacksAccount, POOL_ADDRESS } from "../__mocks__/account.mock";

const mockAccount = makeStacksAccount();

jest.mock("LLM/hooks/useAccountScreen", () => ({
  useAccountScreen: () => ({ account: mockAccount, parentAccount: undefined }),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => jest.requireActual("../__mocks__/bridge.mock").mockBridge,
}));

jest.mock("@ledgerhq/live-common/bridge/useBridgeTransaction", () => ({
  __esModule: true,
  default: (...args: unknown[]) =>
    jest.requireActual("../__mocks__/bridge.mock").useFakeBridgeTransaction(...args),
}));

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
    const { Text } = jest.requireActual("react-native");
    return (
      <Text testID="shared-select-device">
        {String(route.params.transaction.familySpecificData?.startBurnHt)}
      </Text>
    );
  },
}));

const mockFetchPoxInfo = jest.mocked(fetchPoxInfo);
const poxInfo = (height: number) =>
  ({ current_burnchain_block_height: height }) as Awaited<ReturnType<typeof fetchPoxInfo>>;

const amountSnapshot = mockBridge.updateTransaction(mockBridge.createTransaction(), {
  amount: new BigNumber(1_000_000),
  mode: "delegate",
  valAddress: POOL_ADDRESS,
  familySpecificData: { numCycles: 6, startBurnHt: 900_000 },
});

type Params = { accountId: string; transaction?: Transaction; status?: TransactionStatus };
const setParamsSpy = jest.fn();

/** Holds the route params in state, so `setParams` re-renders the screen like the navigator does. */
function Harness() {
  const [params, setParams] = useState<Params>({
    accountId: mockAccount.id,
    transaction: amountSnapshot,
    status: DEFAULT_STATUS,
  });
  const navigation = useMemo(
    () => ({
      setParams: (patch: Partial<Params>) => {
        setParamsSpy(patch);
        setParams(prev => ({ ...prev, ...patch }));
      },
    }),
    [],
  );
  return (
    <StakingSelectDevice
      navigation={navigation as never}
      route={{ name: ScreenName.StacksStakingSelectDevice, params } as never}
    />
  );
}

describe("Stacks staking SelectDevice", () => {
  beforeEach(() => {
    resetBridgeState();
    setParamsSpy.mockReset();
    mockFetchPoxInfo.mockReset();
  });

  it("only exposes device selection once the refreshed transaction is revalidated", async () => {
    let resolvePox!: (value: Awaited<ReturnType<typeof fetchPoxInfo>>) => void;
    mockFetchPoxInfo.mockReturnValueOnce(new Promise(resolve => (resolvePox = resolve)));
    render(<Harness />);

    // Amount's snapshot must not be signable while the first refresh is in flight.
    expect(screen.getByTestId("stacks-stake-select-device-preparing")).toBeVisible();
    expect(screen.queryByTestId("shared-select-device")).toBeNull();

    resolvePox(poxInfo(900_456));

    await waitFor(() =>
      expect(screen.getByTestId("shared-select-device")).toHaveTextContent("900456"),
    );
    expect(setParamsSpy).toHaveBeenCalledWith({
      transaction: expect.objectContaining({
        mode: "delegate",
        familySpecificData: { numCycles: 6, startBurnHt: 900_456 },
      }),
      status: expect.objectContaining({ errors: {} }),
    });
  });

  it("blocks device selection when the revalidated status has an error", async () => {
    mockFetchPoxInfo.mockResolvedValue(poxInfo(900_456));
    const preparePhase = new Error("prepare phase");
    preparePhase.name = "StacksStakeInPreparePhase";
    bridgeState.status = { ...DEFAULT_STATUS, errors: { data: preparePhase } };
    render(<Harness />);

    await waitFor(() =>
      expect(screen.getByTestId("stacks-stake-select-device-error")).toBeVisible(),
    );
    expect(screen.queryByTestId("shared-select-device")).toBeNull();
    expect(setParamsSpy).not.toHaveBeenCalled();
  });

  it("replaces the device list with a retry when the height can't be refreshed", async () => {
    mockFetchPoxInfo.mockRejectedValueOnce(new Error("pox unavailable"));
    render(<Harness />);

    await waitFor(() =>
      expect(screen.getByTestId("stacks-stake-select-device-error")).toBeVisible(),
    );
    expect(screen.queryByTestId("shared-select-device")).toBeNull();

    mockFetchPoxInfo.mockResolvedValueOnce(poxInfo(900_789));
    fireEvent.press(screen.getByTestId("stacks-stake-select-device-retry"));

    await waitFor(() =>
      expect(screen.getByTestId("shared-select-device")).toHaveTextContent("900789"),
    );
  });
});
