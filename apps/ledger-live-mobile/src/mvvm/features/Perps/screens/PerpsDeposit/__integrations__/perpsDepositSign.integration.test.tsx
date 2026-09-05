import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { act, render, screen } from "@tests/test-renderer";
import type { PerpsDepositExecutionCallbacks } from "LLM/features/Perps/hooks/usePerpsDepositExecution";
import PerpsDepositScreen from "../PerpsDepositScreen";

const mockOpenDrawer = jest.fn();
jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: () => ({ openDrawer: mockOpenDrawer }),
}));

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculateCountervalueCallback: () => (_currency: unknown, value: BigNumber) => value,
  useCountervaluesState: () => ({}),
}));

jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues/logic"),
  calculate: () => 20000000000000000,
}));

const mockUsePerpsDepositQuote = jest.fn();
jest.mock("../usePerpsDepositQuote", () => ({
  usePerpsDepositQuote: () => mockUsePerpsDepositQuote(),
}));

let capturedCallbacks: PerpsDepositExecutionCallbacks | undefined;
const mockExecuteDeposit = jest.fn();
jest.mock("LLM/features/Perps/hooks/usePerpsDepositExecution", () => ({
  usePerpsDepositExecution: (_params: unknown, callbacks: PerpsDepositExecutionCallbacks) => {
    capturedCallbacks = callbacks;
    return {
      deviceStep: { kind: "processing" },
      executeDeposit: mockExecuteDeposit,
      retry: jest.fn(),
    };
  },
}));

jest.mock("~/components/SelectDevice2", () => {
  const { Text, TouchableOpacity } = require("react-native");
  return {
    __esModule: true,
    default: ({ onSelect }: { onSelect: (device: unknown) => void }) => (
      <TouchableOpacity
        testID="select-device"
        onPress={() => onSelect({ deviceId: "device-1", modelId: "stax", wired: false })}
      >
        <Text>SelectDevice</Text>
      </TouchableOpacity>
    ),
  };
});

function createAccount(id: string, spendableBalance: number): Account {
  return {
    ...genAccount(id, { currency: getCryptoCurrencyById("ethereum"), operationsSize: 0 }),
    spendableBalance: new BigNumber(spendableBalance),
    balance: new BigNumber(spendableBalance),
  };
}

const receiverAccount = createAccount("receiver-1", 0);
const fundingAccount = createAccount("funding-1", 10000);

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() };
const mockRoute = { params: { receiverAccount } };

function renderDeposit() {
  return render(
    <PerpsDepositScreen navigation={mockNavigation as never} route={mockRoute as never} />,
    {
      overrideInitialState: state => ({
        ...state,
        accounts: { ...state.accounts, active: [fundingAccount] },
      }),
    },
  );
}

/** Walks the form up to the point where the summary is on screen. */
async function fillFormAndReview(user: ReturnType<typeof renderDeposit>["user"]) {
  await user.press(screen.getByTestId("perps-deposit-select-currency"));
  const { onAccountSelected } = mockOpenDrawer.mock.calls[0][0];
  act(() => onAccountSelected(fundingAccount));

  await user.press(screen.getByTestId("perps-deposit-key-2"));
  await user.press(screen.getByTestId("perps-deposit-key-0"));
  await user.press(screen.getByTestId("perps-deposit-review-cta"));

  return screen.findByTestId("perps-deposit-cta");
}

describe("PerpsDepositSign integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedCallbacks = undefined;
    mockUsePerpsDepositQuote.mockReturnValue({
      quote: { amountTo: new BigNumber(42) },
      isLoading: false,
      isUnavailable: false,
    });
  });

  it("asks for a device once the summary is confirmed, without leaving the deposit screen", async () => {
    const { user } = renderDeposit();

    await user.press(await fillFormAndReview(user));

    // The device list covers the form, as in every signing flow.
    expect(await screen.findByTestId("select-device")).toBeOnTheScreen();
    // Picking a device is what starts the deposit, so nothing has run yet.
    expect(mockExecuteDeposit).not.toHaveBeenCalled();
    // It takes over in place, so no new screen is pushed.
    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });

  it("runs the deposit once a device is picked", async () => {
    const { user } = renderDeposit();

    await user.press(await fillFormAndReview(user));
    await user.press(await screen.findByTestId("select-device"));

    expect(screen.getByTestId("perps-deposit-sign-step")).toBeOnTheScreen();
    expect(mockExecuteDeposit).toHaveBeenCalledTimes(1);
    // The list has served its purpose, so the deposit is what sits behind the drawer.
    expect(screen.queryByTestId("select-device")).not.toBeOnTheScreen();
    expect(screen.getByTestId("perps-deposit-amount-input")).toBeOnTheScreen();
  });

  it("drops the device step when the deposit is declined, so the summary is back in front", async () => {
    const { user } = renderDeposit();

    await user.press(await fillFormAndReview(user));
    await user.press(await screen.findByTestId("select-device"));

    act(() => capturedCallbacks?.onRefused());

    expect(screen.queryByTestId("perps-deposit-sign-step")).not.toBeOnTheScreen();
    // The form comes back with the typed amount, so the holder can sign again as-is.
    expect(screen.getByTestId("perps-deposit-amount-input").props.value).toBe("20");
    expect(screen.getByTestId("perps-deposit-amount-sent")).toBeOnTheScreen();
  });

  it("goes straight back to the same device after a decline, without asking again", async () => {
    const { user } = renderDeposit();

    await user.press(await fillFormAndReview(user));
    await user.press(await screen.findByTestId("select-device"));
    act(() => capturedCallbacks?.onRefused());

    await user.press(screen.getByTestId("perps-deposit-cta"));

    // The device list would otherwise flash up before auto-selection re-picked it.
    expect(await screen.findByTestId("perps-deposit-sign-step")).toBeOnTheScreen();
    expect(screen.queryByTestId("select-device")).not.toBeOnTheScreen();
    expect(mockExecuteDeposit).toHaveBeenCalledTimes(2);
  });

  it("drops the device step once the deposit lands", async () => {
    const { user } = renderDeposit();

    await user.press(await fillFormAndReview(user));
    await user.press(await screen.findByTestId("select-device"));

    act(() => capturedCallbacks?.onDone());

    expect(screen.queryByTestId("perps-deposit-sign-step")).not.toBeOnTheScreen();
  });
});
