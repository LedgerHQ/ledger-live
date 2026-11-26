import React from "react";
import { Text } from "react-native";
import { Observable } from "rxjs";
import type { InitialState } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { DdRum } from "@datadog/mobile-react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { render, screen, waitFor, withReadOnlyDisabled } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { isOperationActive, setOperationSink } from "@shared/observability-operations";
import AddAccountsNavigator from "LLM/features/Accounts/Navigator";
import { ADD_ACCOUNT_OPERATION } from "LLM/features/Accounts/constants";
import { datadogOperationSink } from "~/datadogOperationSink";

jest.mock("@datadog/mobile-react-native", () => require("@tests/mocks/datadogMobileReactNative"));
jest.mock("~/datadog", () => ({
  ...jest.requireActual("~/datadog"),
  isDatadogRecording: () => true,
}));

jest.mock("@ledgerhq/live-common/bridge/index", () => ({
  __esModule: true,
  getCurrencyBridge: () => {
    const bridge = {
      scanAccounts: () => new Observable<{ account: Account }>(() => {}),
      preload: () => Promise.resolve(true),
      hydrate: () => true,
    };
    return Object.assign(Promise.resolve(bridge), { status: "fulfilled" as const, value: bridge });
  },
  getAccountBridge: () => {
    const accountBridge = { isAccountEmpty: () => false };
    return Object.assign(Promise.resolve(accountBridge), {
      status: "fulfilled" as const,
      value: accountBridge,
    });
  },
}));

const failFeatureOperation = jest.mocked(DdRum.failFeatureOperation);

const HOME = "RumOperationTestHome";
const Stack = createNativeStackNavigator();

function AddAccountsHarness() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={HOME}>{() => <Text>Home</Text>}</Stack.Screen>
      <Stack.Screen name={NavigatorName.AddAccounts} component={AddAccountsNavigator} />
    </Stack.Navigator>
  );
}

const scanDeviceAccountsState: InitialState = {
  index: 1,
  routes: [
    { name: HOME },
    {
      name: NavigatorName.AddAccounts,
      state: {
        routes: [
          {
            name: ScreenName.ScanDeviceAccounts,
            params: {
              currency: getCryptoCurrencyById("ethereum"),
              device: {
                deviceId: "device-1",
                deviceName: "Nano X",
                modelId: DeviceModelId.nanoX,
                wired: false,
              },
              context: "addAccounts",
            },
          },
        ],
      },
    },
  ],
};

const renderScanDeviceAccounts = async () => {
  const rendered = render(<AddAccountsHarness />, {
    navigationInitialState: scanDeviceAccountsState,
    overrideInitialState: withReadOnlyDisabled,
  });
  await waitFor(() => expect(isOperationActive(ADD_ACCOUNT_OPERATION)).toBe(true));
  return rendered;
};

describe("ScanDeviceAccounts header add_account RUM operation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setOperationSink(datadogOperationSink);
  });

  it("should abandon the operation with the back trigger on the header back", async () => {
    const { user } = await renderScanDeviceAccounts();

    await user.press(screen.getAllByTestId("navigation-header-back-button")[0]);

    expect(await screen.findByText("Home")).toBeVisible();
    expect(failFeatureOperation).toHaveBeenCalledTimes(1);
    expect(failFeatureOperation).toHaveBeenCalledWith(
      "add_account",
      null,
      "ABANDONED",
      expect.objectContaining({ trigger: "back", currency_id: "ethereum" }),
    );
  });

  it("should tell how far the scan got when the header closes the flow", async () => {
    const { user } = await renderScanDeviceAccounts();

    await user.press(screen.getAllByTestId("NavigationHeaderCloseButton")[0]);
    await user.press(await screen.findByText("Cancel"));

    await waitFor(() => expect(failFeatureOperation).toHaveBeenCalledTimes(1));
    expect(failFeatureOperation.mock.calls[0][3]).toMatchObject({
      trigger: "close",
      step: "scanning",
      accounts_scanned: 0,
      device_model_id: DeviceModelId.nanoX,
      transport: "ble",
    });
  });

  it("should abandon the operation with the close trigger on the confirmed header close", async () => {
    const { user } = await renderScanDeviceAccounts();

    await user.press(screen.getAllByTestId("NavigationHeaderCloseButton")[0]);
    await user.press(await screen.findByText("Cancel"));

    await waitFor(() => expect(failFeatureOperation).toHaveBeenCalledTimes(1));
    expect(failFeatureOperation).toHaveBeenCalledWith(
      "add_account",
      null,
      "ABANDONED",
      expect.objectContaining({ trigger: "close", currency_id: "ethereum" }),
    );
  });
});
