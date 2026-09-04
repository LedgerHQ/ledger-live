import React from "react";
import { Text } from "react-native";
import Share from "react-native-share";
import { captureRef } from "react-native-view-shot";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { VerifyAddressIntentJobState } from "@features/platform-verify-address-intent";
import { render, screen, waitFor, act } from "@tests/test-renderer";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { importCountervalues } from "@ledgerhq/live-countervalues/logic";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { screen as trackScreen } from "~/analytics/segment";
import type { State } from "~/reducers/types";
import PayTabNavigator from "LLM/features/PayTab";
import { PayTabRequestReceiveScreen } from "LLM/features/PayTab/screens/RequestReceive";
import type { PayTabNavigatorParamList } from "LLM/features/PayTab/types";
import { payTabEthAccount, payTabUsdcAccount, usd, usdc } from "./fixtures";

const REQUEST_TITLE = "Request USD Coin";
const VERIFY = "Verify";
const VERIFY_ADDRESS = "Verify address";
const VERIFY_INTRO = "Verify your address";
const DIE_LABEL = "Ledger Secure Screen";
const PAY_DEPOSIT = "Add stablecoin";

jest.mock("~/analytics", () => ({
  ...jest.requireActual("~/analytics"),
  track: jest.fn(),
}));

jest.mock("@features/flow-pay-card", () => ({
  Card: () => null,
}));

type CapturedExecutor = {
  intent: { input: { expectedAddress: string } };
  onIntentJobStateChanged: (jobState: VerifyAddressIntentJobState) => void;
  onUserCancel: () => void;
};

let capturedExecutor: CapturedExecutor | undefined;

jest.mock("LLM/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
  DeviceIntentExecutorLWM: (props: CapturedExecutor) => {
    capturedExecutor = props;
    return <Text>Ledger Secure Screen</Text>;
  },
}));

const mockedBuildInit = jest.mocked(buildDeviceInitializationInput);

const RequestStack = createNativeStackNavigator<PayTabNavigatorParamList>();
const PayTabStack = createNativeStackNavigator<{ PayTabTest: undefined }>();

function withUsdcHoldings(state: State): State {
  return {
    ...state,
    accounts: { active: [{ ...payTabEthAccount, subAccounts: [payTabUsdcAccount] }] },
    countervalues: {
      ...state.countervalues,
      countervalues: {
        ...state.countervalues.countervalues,
        state: importCountervalues(
          { status: {}, [pairId({ from: usdc, to: usd })]: { latest: 1 } },
          state.countervalues.userSettings,
        ),
      },
    },
  };
}

function renderRequestReceive(
  params: PayTabNavigatorParamList[typeof ScreenName.PayTabRequestReceive] = {
    accountId: payTabEthAccount.id,
    currency: usdc,
  },
) {
  return render(
    <RequestStack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <RequestStack.Screen
        name={ScreenName.PayTabRequestReceive}
        component={PayTabRequestReceiveScreen}
        initialParams={params}
      />
    </RequestStack.Navigator>,
    { overrideInitialState: withUsdcHoldings },
  );
}

function renderRequestReceiveFromPayTab() {
  return render(
    <PayTabStack.Navigator screenOptions={{ headerShown: false, animation: "none" }}>
      <PayTabStack.Screen name="PayTabTest" component={PayTabNavigator} />
    </PayTabStack.Navigator>,
    {
      overrideInitialState: state => ({
        ...withUsdcHoldings(state),
        payCardFeatureTour: { ...state.payCardFeatureTour, hasSeenFeatureTour: true },
      }),
      navigationInitialState: {
        index: 0,
        routes: [
          {
            name: "PayTabTest",
            state: {
              index: 1,
              routes: [
                { name: ScreenName.PayTab },
                {
                  name: ScreenName.PayTabRequestReceive,
                  params: {
                    accountId: payTabEthAccount.id,
                    currency: usdc,
                  },
                },
              ],
            },
          },
        ],
      },
    },
  );
}

async function startVerify(user: { press: (element: unknown) => Promise<unknown> }): Promise<void> {
  await user.press(await screen.findByRole("button", { name: VERIFY }));
  await user.press(await screen.findByRole("button", { name: VERIFY_ADDRESS }));
  expect(await screen.findByText(DIE_LABEL)).toBeVisible();
}

describe("PayTab RequestReceive integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedExecutor = undefined;
    mockedBuildInit.mockResolvedValue({} as never);
  });

  it("should render the request receive card for the selected account", async () => {
    renderRequestReceive();

    expect(await screen.findByText(REQUEST_TITLE)).toBeVisible();
    expect(screen.getByRole("button", { name: "Share" })).toBeVisible();
    expect(screen.getByRole("button", { name: VERIFY })).toBeVisible();
  });

  it("should render an error when the account is missing", () => {
    renderRequestReceive({
      accountId: "missing-account",
      currency: usdc,
    });

    expect(screen.getByTestId("generic-error-modal")).toBeVisible();
    expect(screen.queryByText(REQUEST_TITLE)).toBeNull();
  });

  it("should share a picture of the request card when Share is pressed", async () => {
    const { user } = renderRequestReceive();

    await user.press(await screen.findByRole("button", { name: "Share" }));

    await waitFor(() => {
      expect(captureRef).toHaveBeenCalledWith(expect.anything(), { format: "png" });
      expect(Share.open).toHaveBeenCalledWith({
        url: "file://mock.png",
        message: payTabEthAccount.freshAddress,
        failOnCancel: false,
      });
    });
  });

  it("should open the verify intro sheet from the Verify action and track the page", async () => {
    const { user } = renderRequestReceive();

    await user.press(await screen.findByRole("button", { name: VERIFY }));

    expect(await screen.findByText(VERIFY_INTRO)).toBeVisible();
    await waitFor(() => {
      expect(jest.mocked(trackScreen)).toHaveBeenCalledWith(
        "Request Address Verification",
        undefined,
        expect.anything(),
        true,
        true,
        false,
        false,
      );
    });
    expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
      button: "verify",
      buttonLocation: "request",
      page: "Pay",
    });
    expect(screen.getByRole("button", { name: VERIFY_ADDRESS })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
  });

  it("should keep the intro visible until device initialization resolves", async () => {
    let release!: (value: never) => void;
    mockedBuildInit.mockImplementation(
      () =>
        new Promise(resolve => {
          release = resolve;
        }),
    );
    const { user } = renderRequestReceive();

    await user.press(await screen.findByRole("button", { name: VERIFY }));
    await user.press(await screen.findByRole("button", { name: VERIFY_ADDRESS }));

    expect(screen.getByText(VERIFY_INTRO)).toBeVisible();
    expect(screen.queryByText(DIE_LABEL)).toBeNull();

    await act(async () => {
      release({} as never);
    });

    expect(await screen.findByText(DIE_LABEL)).toBeVisible();
    expect(screen.queryByText(VERIFY_INTRO)).toBeNull();
  });

  it("should mount the DIE on verify and keep the request card once the address is confirmed", async () => {
    const { user } = renderRequestReceive();

    await startVerify(user);

    expect(capturedExecutor?.intent.input.expectedAddress).toBe(payTabEthAccount.freshAddress);
    expect(jest.mocked(track)).toHaveBeenCalledWith("button_clicked", {
      button: "verify address",
      buttonLocation: "verify address",
      page: "Request Address Verification",
    });

    act(() => {
      capturedExecutor!.onIntentJobStateChanged({
        type: "verified",
        address: payTabEthAccount.freshAddress,
      });
    });

    expect(await screen.findByText(REQUEST_TITLE)).toBeVisible();
    expect(screen.queryByText(DIE_LABEL)).toBeNull();
    expect(jest.mocked(track)).toHaveBeenCalledWith("request_verification_complete", {
      page: "Request Address Verification",
    });
  });

  it("should keep the request card when the user dismisses the DIE before confirming", async () => {
    const { user } = renderRequestReceive();

    await startVerify(user);
    act(() => capturedExecutor!.onUserCancel());

    expect(await screen.findByText(REQUEST_TITLE)).toBeVisible();
    expect(screen.queryByText(DIE_LABEL)).toBeNull();
    expect(jest.mocked(track)).toHaveBeenCalledWith("request_verification_dismiss", {
      page: "Request Address Verification",
    });
  });

  it.each(["cancelled", "unsupported"] as const)(
    "should keep the request card when the user closes a %s device outcome",
    async type => {
      const { user } = renderRequestReceive();

      await startVerify(user);
      act(() => {
        capturedExecutor!.onIntentJobStateChanged(
          type === "cancelled"
            ? { type: "cancelled", retry: jest.fn() }
            : { type: "unsupported", error: new Error("cannot display") },
        );
        capturedExecutor!.onUserCancel();
      });

      expect(await screen.findByText(REQUEST_TITLE)).toBeVisible();
      expect(screen.queryByText(DIE_LABEL)).toBeNull();
      expect(jest.mocked(track)).toHaveBeenCalledWith(`request_verification_${type}`, {
        page: "Request Address Verification",
      });
      expect(jest.mocked(track)).toHaveBeenCalledWith("request_verification_dismiss", {
        page: "Request Address Verification",
      });
    },
  );

  it("should leave the request screen only after the user closes a mismatch", async () => {
    const { user } = renderRequestReceiveFromPayTab();

    await startVerify(user);

    act(() => {
      capturedExecutor!.onIntentJobStateChanged({
        type: "mismatch",
        expectedAddress: payTabEthAccount.freshAddress,
        reportedAddress: "0xDEAD",
      });
    });

    expect(screen.getByText(REQUEST_TITLE)).toBeVisible();
    expect(jest.mocked(track)).toHaveBeenCalledWith("request_verification_mismatch", {
      page: "Request Address Verification",
    });

    act(() => capturedExecutor!.onUserCancel());

    await waitFor(() => {
      expect(screen.queryByText(REQUEST_TITLE)).toBeNull();
    });
    expect(screen.getByRole("button", { name: PAY_DEPOSIT })).toBeVisible();
    expect(jest.mocked(track)).toHaveBeenCalledWith("request_verification_dismiss", {
      page: "Request Address Verification",
    });
  });

  it("should keep the request card when device initialization fails", async () => {
    mockedBuildInit.mockRejectedValueOnce(new Error("fail"));
    const { user } = renderRequestReceive();

    await user.press(await screen.findByRole("button", { name: VERIFY }));
    await user.press(await screen.findByRole("button", { name: VERIFY_ADDRESS }));

    await waitFor(() => expect(mockedBuildInit).toHaveBeenCalled());
    expect(screen.queryByText(DIE_LABEL)).toBeNull();
    expect(screen.getByText(REQUEST_TITLE)).toBeVisible();
  });
});
