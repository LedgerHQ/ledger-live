import React from "react";
import { Observable } from "rxjs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { SignOperationEvent } from "@ledgerhq/types-live";
import { HEDERA_TRANSACTION_MODES } from "@ledgerhq/live-common/families/hedera/constants";
import { render, screen, waitFor } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { component } from "../index";
import { HEDERA_ACCOUNT_1, overrideWithHederaAccount1 } from "../../__mocks__/account.mock";
import { makeMockAccountBridge } from "../../__mocks__/bridge.mock";
import { mockEnrichedDelegation } from "../../__mocks__/delegation.mock";

jest.mock("LLM/features/NotificationsPrompt", () => ({
  useNotificationsContext: () => ({ notifyFlowCompleted: jest.fn() }),
}));

jest.mock(
  "@ledgerhq/live-common/hw/actions/app",
  () => require("../../__mocks__/deviceConnection.mock").hwActionsAppModule,
);

jest.mock(
  "@ledgerhq/live-common/hw/index",
  () => require("../../__mocks__/deviceConnection.mock").hwIndexModule,
);

jest.mock(
  "~/hooks/useIsDeviceLockedPolling/useIsDeviceLockedPolling",
  () => require("../../__mocks__/deviceConnection.mock").deviceLockedPollingModule,
);

jest.mock("~/datadog", () => ({
  isDatadogEnabled: false,
  initializeDatadogProvider: jest.fn(),
  customErrorEventMapper: jest.fn(),
  customActionEventMapper: jest.fn(),
  customLogEventMapper: jest.fn(),
  viewNamePredicate: jest.fn(),
  broadcastLogger: jest.fn(),
}));

const mockAccountBridge = makeMockAccountBridge(HEDERA_TRANSACTION_MODES.Undelegate);

jest.mock("@ledgerhq/live-common/bridge/index", () => {
  const {
    makeResolvedAccountBridge,
    resolvedCurrencyBridge,
  } = require("../../__mocks__/bridge.mock");
  return {
    __esModule: true,
    getAccountBridge: () => makeResolvedAccountBridge(mockAccountBridge),
    getCurrencyBridge: () => resolvedCurrencyBridge,
  };
});

const OuterStack = createNativeStackNavigator();

function UndelegationFlowHarness() {
  return (
    <OuterStack.Navigator screenOptions={{ headerShown: false }}>
      <OuterStack.Screen name={NavigatorName.HederaUndelegationFlow} component={component} />
    </OuterStack.Navigator>
  );
}

function renderFlow() {
  return render(<UndelegationFlowHarness />, {
    navigationInitialState: {
      index: 0,
      routes: [
        {
          name: NavigatorName.HederaUndelegationFlow,
          state: {
            index: 0,
            routes: [
              {
                name: ScreenName.HederaUndelegationAmount,
                params: {
                  accountId: HEDERA_ACCOUNT_1.id,
                  enrichedDelegation: mockEnrichedDelegation,
                },
              },
            ],
          },
        },
      ],
    },
    overrideInitialState: overrideWithHederaAccount1,
  });
}
describe("Hedera UndelegationFlow (integration)", () => {
  beforeEach(() => {
    mockAccountBridge.createTransaction.mockClear();
    mockAccountBridge.signOperation.mockClear();
  });

  it("completes the happy path: Amount → SelectDevice → ConnectDevice → ValidationSuccess", async () => {
    const { user } = renderFlow();

    await waitFor(
      () => expect(screen.getByTestId("enabled-hedera-amount-continue-button")).toBeVisible(),
      { timeout: 10000 },
    );
    await user.press(screen.getByTestId("enabled-hedera-amount-continue-button"));

    const deviceItem = await screen.findByTestId("device-item-mock", {}, { timeout: 10000 });
    await user.press(deviceItem);

    await waitFor(() => expect(screen.getByTestId("validate-success-screen")).toBeVisible(), {
      timeout: 15000,
    });
  });

  it("lands on ValidationError and shows Retry when signOperation fails", async () => {
    mockAccountBridge.signOperation.mockImplementationOnce(
      () =>
        new Observable<SignOperationEvent>(subscriber => {
          subscriber.next({ type: "device-signature-requested" });
          subscriber.error(new Error("UserRefusedOnDevice"));
        }),
    );

    const { user } = renderFlow();

    await waitFor(
      () => expect(screen.getByTestId("enabled-hedera-amount-continue-button")).toBeVisible(),
      { timeout: 10000 },
    );
    await user.press(screen.getByTestId("enabled-hedera-amount-continue-button"));

    const deviceItem = await screen.findByTestId("device-item-mock", {}, { timeout: 10000 });
    await user.press(deviceItem);

    await waitFor(() => expect(screen.getByText("Retry")).toBeVisible(), { timeout: 15000 });
    expect(screen.queryByTestId("validate-success-screen")).toBeNull();
  });
});
