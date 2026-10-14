import React from "react";
import BigNumber from "bignumber.js";
import { act, fireEvent, render, screen, waitFor } from "@tests/test-renderer";
import { fetchPoxInfo } from "@ledgerhq/live-common/families/stacks/react";
import { ScreenName } from "~/const";
import Amount from "../StakingFlow/Amount";
import { makeStacksAccount, POOL_ADDRESS } from "../__mocks__/account.mock";
import { bridgeState, resetBridgeState } from "../__mocks__/bridge.mock";

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

jest.mock("~/screens/SendFunds/AmountInput", () => {
  const { TextInput } = jest.requireActual("react-native");
  const { BigNumber } = jest.requireActual("bignumber.js");
  return ({ onChange, testID }: { onChange: (v: BigNumber) => void; testID: string }) => (
    <TextInput testID={testID} onChangeText={(v: string) => onChange(new BigNumber(v))} />
  );
});

const mockFetchPoxInfo = jest.mocked(fetchPoxInfo);

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => {
    resolve = r;
  });
  return { promise, resolve: (value: T) => resolve(value) };
}
const navigate = jest.fn();

const renderScreen = () =>
  render(
    <Amount
      navigation={{ navigate } as never}
      route={
        {
          name: ScreenName.StacksStakingAmount,
          params: { accountId: mockAccount.id, valAddress: POOL_ADDRESS, numCycles: 6 },
        } as never
      }
    />,
  );

const continueButton = () => screen.getByTestId("stacks-stake-amount-continue");

describe("Stacks staking Amount", () => {
  beforeEach(() => {
    resetBridgeState();
    navigate.mockReset();
    mockFetchPoxInfo.mockReset();
  });

  it("resolves startBurnHt and hands a complete delegate transaction to the device step", async () => {
    mockFetchPoxInfo.mockResolvedValue({ current_burnchain_block_height: 900_123 } as Awaited<
      ReturnType<typeof fetchPoxInfo>
    >);
    renderScreen();

    fireEvent.changeText(screen.getByTestId("stacks-stake-amount-input"), "1000000");
    await waitFor(() => expect(continueButton()).toBeEnabled());
    fireEvent.press(continueButton());

    expect(navigate).toHaveBeenCalledWith(
      ScreenName.StacksStakingSelectDevice,
      expect.objectContaining({
        transaction: expect.objectContaining({
          mode: "delegate",
          valAddress: POOL_ADDRESS,
          amount: new BigNumber(1_000_000),
          familySpecificData: { numCycles: 6, startBurnHt: 900_123 },
        }),
      }),
    );
  });

  it("blocks Continue until startBurnHt resolves", async () => {
    const poxInfo = deferred<Awaited<ReturnType<typeof fetchPoxInfo>>>();
    mockFetchPoxInfo.mockReturnValue(poxInfo.promise);
    renderScreen();

    fireEvent.changeText(screen.getByTestId("stacks-stake-amount-input"), "1000000");
    expect(continueButton()).toBeDisabled();

    await act(async () => {
      poxInfo.resolve({ current_burnchain_block_height: 1 } as Awaited<
        ReturnType<typeof fetchPoxInfo>
      >);
    });
    expect(continueButton()).toBeEnabled();
  });

  it("surfaces a pox info failure with a working retry", async () => {
    mockFetchPoxInfo.mockRejectedValueOnce(new Error("pox down"));
    renderScreen();

    await waitFor(() => expect(screen.getByTestId("stacks-stake-amount-retry")).toBeVisible());
    fireEvent.changeText(screen.getByTestId("stacks-stake-amount-input"), "1000000");
    expect(continueButton()).toBeDisabled();

    mockFetchPoxInfo.mockResolvedValueOnce({ current_burnchain_block_height: 7 } as Awaited<
      ReturnType<typeof fetchPoxInfo>
    >);
    fireEvent.press(screen.getByTestId("stacks-stake-amount-retry"));

    await waitFor(() => expect(screen.queryByTestId("stacks-stake-amount-error")).toBeNull());
    expect(continueButton()).toBeEnabled();
  });

  // useBridgeTransaction never settles a failed preparation: bridgeError comes with bridgePending.
  it("offers Retry when the bridge's own preparation fails (e.g. validateIntent's /v2/pox call)", async () => {
    mockFetchPoxInfo.mockResolvedValue({ current_burnchain_block_height: 1 } as Awaited<
      ReturnType<typeof fetchPoxInfo>
    >);
    bridgeState.bridgeError = new Error("bridge pox request failed");
    bridgeState.bridgePending = true;
    renderScreen();

    await waitFor(() => expect(mockFetchPoxInfo).toHaveBeenCalledTimes(1));
    // Shown once, in the alert with its Retry, not again in the footer.
    expect(screen.getAllByText("bridge pox request failed")).toHaveLength(1);
    expect(screen.getByTestId("stacks-stake-amount-retry")).toBeEnabled();

    fireEvent.press(screen.getByTestId("stacks-stake-amount-retry"));

    await waitFor(() => expect(mockFetchPoxInfo).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId("stacks-stake-amount-retry")).toBeDisabled();
    expect(continueButton()).toBeDisabled();
  });

  it("keeps Continue disabled while the bridge reports an error", async () => {
    mockFetchPoxInfo.mockResolvedValue({ current_burnchain_block_height: 1 } as Awaited<
      ReturnType<typeof fetchPoxInfo>
    >);
    bridgeState.status = {
      ...bridgeState.status,
      errors: { amount: new Error("NotEnoughBalance") },
    };
    renderScreen();

    fireEvent.changeText(screen.getByTestId("stacks-stake-amount-input"), "1000000");
    await waitFor(() => expect(mockFetchPoxInfo).toHaveBeenCalled());
    expect(continueButton()).toBeDisabled();
  });
});
