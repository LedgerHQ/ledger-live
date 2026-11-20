import React, { useEffect } from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { DeviceConnectionParams } from "@features/platform-device-intent";
import type { HyperliquidSignIntent } from "@features/platform-intent-hyperliquid-sign";
import { act, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { PerpsWebView } from "../components/PerpsWebView/PerpsWebView";
import type { PerpsWebviewInputs } from "../screens/PerpsLiveApp/usePerpsLiveAppViewModel";

let mockCustomHandlers: WalletAPICustomHandlers | undefined;
jest.mock("~/components/Web3AppWebview", () => ({
  Web3AppWebview: (props: { customHandlers: WalletAPICustomHandlers }) => {
    mockCustomHandlers = props.customHandlers;
    return null;
  },
}));

jest.mock("~/components/WebPlatformPlayer/CustomHandlers", () => ({
  useDeeplinkCustomHandlers: () => ({}),
}));

type ExecutorProps = {
  sourceFlow: string;
  analyticsProperties?: Record<string, unknown>;
  deviceConnectionParams: DeviceConnectionParams;
  deviceInitializationInput: unknown;
  intent: HyperliquidSignIntent;
  onIntentJobComplete: () => void;
  onUserCancel: () => void;
  isRequestingToBeOpened?: boolean;
  onDeviceSheetDismissed?: () => void;
};

let mockExecutorProps: ExecutorProps | undefined;
jest.mock("LLM/components/DeviceIntentExecutor", () => {
  const ReactModule = require("react");
  const { View } = require("react-native");
  return {
    buildDeviceInitializationInput: jest.fn(() => Promise.resolve({ appName: "Hyperliquid" })),
    DeviceIntentExecutor: (props: ExecutorProps) => {
      mockExecutorProps = props;
      return ReactModule.createElement(View, { testID: "device-intent-executor" });
    },
  };
});

const hyperliquidAccount = genAccount("perps-sign-hl", {
  currency: getCryptoCurrencyById("hypercore"),
});
const manifest = { id: "perps-live-app", name: "Perps" } as LiveAppManifest;
const inputs: PerpsWebviewInputs = {
  source: "ledger-live",
  devMode: "false",
  theme: "dark",
  lang: "en",
  locale: "en-US",
  countryLocale: "US",
  currencyTicker: "USD",
  OS: "ios",
  platform: "LLM",
  shareAnalytics: "false",
  hasSeenAnalyticsOptInPrompt: "true",
};
const SIGNATURES = [{ r: "0xr", s: "0xs", v: 27 }];

type TestStackParamList = {
  Perps: undefined;
  Other: undefined;
};
const Stack = createNativeStackNavigator<TestStackParamList>();
let testNavigation: { navigate: (route: "Other") => void; goBack: () => void } | undefined;

function PerpsHostScreen() {
  const nav = useNavigation();
  useEffect(() => {
    testNavigation = nav as unknown as typeof testNavigation;
  }, [nav]);
  return (
    <PerpsWebView
      manifest={manifest}
      setWebviewState={jest.fn()}
      inputs={inputs}
      accounts={[hyperliquidAccount]}
    />
  );
}

function OtherScreen() {
  return <Text testID="other-screen">Other</Text>;
}

type SignActions = (req: {
  params: { accountId: string; metadataWithSignature: string; actions: unknown[] };
}) => Promise<{ signatures: typeof SIGNATURES }>;

function renderPerps() {
  render(
    <Stack.Navigator initialRouteName="Perps">
      <Stack.Screen name="Perps" component={PerpsHostScreen} />
      <Stack.Screen name="Other" component={OtherScreen} />
    </Stack.Navigator>,
    {
      overrideInitialState: withFlagOverrides({
        ptxPerpsDeviceIntentSignMobile: { enabled: true },
      }),
    },
  );
}

function requestSignature() {
  const signActions = mockCustomHandlers!["custom.perps.signActions"] as SignActions;
  let request!: ReturnType<SignActions>;
  act(() => {
    request = signActions({
      params: {
        accountId: getWalletApiIdFromAccountId(hyperliquidAccount.id),
        metadataWithSignature: "0x01",
        actions: [{ action: { type: "cancel", cancels: [{ a: 1, o: 42 }] }, nonce: 1 }],
      },
    });
  });
  return request;
}

describe("Perps sign drawer integration", () => {
  beforeAll(() => setWalletApiIdForAccountId(hyperliquidAccount.id));
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(buildDeviceInitializationInput)
      .mockImplementation(() => Promise.resolve({ appName: "Hyperliquid" } as never));
    mockCustomHandlers = undefined;
    mockExecutorProps = undefined;
    testNavigation = undefined;
  });

  it("should open the executor over the live app for the Hyperliquid app with Nano S excluded", async () => {
    renderPerps();

    const request = requestSignature();
    request.catch(() => {});

    expect(await screen.findByTestId("device-intent-executor")).toBeTruthy();
    expect(mockExecutorProps?.isRequestingToBeOpened).toBe(true);
    expect(mockExecutorProps?.sourceFlow).toBe("wallet_api");
    expect(mockExecutorProps?.analyticsProperties).toEqual({
      manifestId: "perps-live-app",
      manifestName: "Perps",
    });
    expect(mockExecutorProps?.deviceConnectionParams.acceptedDeviceModelIds).not.toContain(
      DeviceModelId.NANO_S,
    );
    expect(mockExecutorProps?.deviceInitializationInput).toEqual({ appName: "Hyperliquid" });
  });

  it("should answer the live app with the signatures and unmount only once the sheet dismisses", async () => {
    renderPerps();
    const request = requestSignature();
    await screen.findByTestId("device-intent-executor");

    act(() => {
      mockExecutorProps!.intent.onResult?.({ type: "signed", signatures: SIGNATURES });
      mockExecutorProps!.onIntentJobComplete();
    });

    await expect(request).resolves.toEqual({ signatures: SIGNATURES });
    expect(screen.getByTestId("device-intent-executor")).toBeTruthy();
    expect(mockExecutorProps?.isRequestingToBeOpened).toBe(false);

    act(() => mockExecutorProps!.onDeviceSheetDismissed?.());
    await waitFor(() => expect(screen.queryByTestId("device-intent-executor")).toBeNull());
  });

  it("should answer the live app with the device refusal and close, leaving the outcome screen to it", async () => {
    renderPerps();
    const request = requestSignature();
    await screen.findByTestId("device-intent-executor");
    const refusal = new UserRefusedOnDevice();

    act(() => {
      mockExecutorProps!.intent.onResult?.({ type: "refused", error: refusal });
      mockExecutorProps!.onIntentJobComplete();
    });

    await expect(request).rejects.toMatchObject({ name: refusal.name });
    expect(mockExecutorProps?.isRequestingToBeOpened).toBe(false);

    act(() => mockExecutorProps!.onDeviceSheetDismissed?.());
    await waitFor(() => expect(screen.queryByTestId("device-intent-executor")).toBeNull());
  });

  it("should answer the live app with a refusal when the user closes the drawer", async () => {
    renderPerps();
    const request = requestSignature();
    await screen.findByTestId("device-intent-executor");

    act(() => mockExecutorProps!.onUserCancel());

    await expect(request).rejects.toMatchObject({ name: new UserRefusedOnDevice().name });
    expect(mockExecutorProps?.isRequestingToBeOpened).toBe(false);

    act(() => mockExecutorProps!.onDeviceSheetDismissed?.());
    await waitFor(() => expect(screen.queryByTestId("device-intent-executor")).toBeNull());
  });

  it("should cancel the pending request and not mount a stale drawer when navigating away before initialization resolves", async () => {
    let resolveInit!: (input: unknown) => void;
    jest.mocked(buildDeviceInitializationInput).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveInit = resolve;
        }) as never,
    );
    renderPerps();

    const request = requestSignature();

    act(() => testNavigation!.navigate("Other"));
    expect(await screen.findByTestId("other-screen")).toBeTruthy();

    await expect(request).rejects.toMatchObject({ name: new UserRefusedOnDevice().name });

    await act(async () => {
      resolveInit({ appName: "Hyperliquid" });
    });
    act(() => testNavigation!.goBack());

    expect(screen.queryByTestId("device-intent-executor")).toBeNull();
  });

  it("should reject the request and clear the drawer without waiting for sheet dismissal when initialization fails", async () => {
    const failure = new Error("network down");
    jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(failure);
    renderPerps();

    const request = requestSignature();

    await expect(request).rejects.toThrow("network down");
    expect(screen.queryByTestId("device-intent-executor")).toBeNull();
  });
});
