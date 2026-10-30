import React from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  getWalletApiIdFromAccountId,
  setWalletApiIdForAccountId,
} from "@ledgerhq/live-common/wallet-api/converters";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import type { HyperliquidSignIntent } from "@features/platform-hyperliquid-sign-intent";
import { act, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { PerpsWebView } from "../components/PerpsWebView/PerpsWebView";
import type { PerpsWebviewInputs } from "../screens/PerpsLiveApp/usePerpsLiveAppViewModel";

// The webview and the Device Intent Executor cannot run in jest. Both are stood in for by
// markers capturing their props, so this test covers the wiring from the live app's
// `custom.perps.signActions` request to the drawer and back.
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
  deviceInitializationInput: unknown;
  intent: HyperliquidSignIntent;
  onIntentJobComplete: () => void;
  onUserCancel: () => void;
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

type SignActions = (req: {
  params: { accountId: string; metadataWithSignature: string; actions: unknown[] };
}) => Promise<{ signatures: typeof SIGNATURES }>;

function renderPerps() {
  render(
    <PerpsWebView
      manifest={manifest}
      setWebviewState={jest.fn()}
      inputs={inputs}
      accounts={[hyperliquidAccount]}
    />,
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
    mockCustomHandlers = undefined;
    mockExecutorProps = undefined;
  });

  it("opens the executor over the live app for the Hyperliquid app", async () => {
    renderPerps();

    const request = requestSignature();
    request.catch(() => {});

    expect(await screen.findByTestId("device-intent-executor")).toBeTruthy();
    expect(mockExecutorProps?.sourceFlow).toBe("wallet_api");
    expect(mockExecutorProps?.analyticsProperties).toEqual({
      manifestId: "perps-live-app",
      manifestName: "Perps",
    });
    expect(mockExecutorProps?.deviceInitializationInput).toEqual({ appName: "Hyperliquid" });
  });

  it("answers the live app with the signatures and closes the drawer", async () => {
    renderPerps();
    const request = requestSignature();
    await screen.findByTestId("device-intent-executor");

    act(() => {
      mockExecutorProps!.intent.onResult?.({ type: "signed", signatures: SIGNATURES });
      mockExecutorProps!.onIntentJobComplete();
    });

    await expect(request).resolves.toEqual({ signatures: SIGNATURES });
    await waitFor(() => expect(screen.queryByTestId("device-intent-executor")).toBeNull());
  });

  it("answers the live app with a refusal when the user closes the drawer", async () => {
    renderPerps();
    const request = requestSignature();
    await screen.findByTestId("device-intent-executor");

    act(() => mockExecutorProps!.onUserCancel());

    await expect(request).rejects.toMatchObject({ name: new UserRefusedOnDevice().name });
    await waitFor(() => expect(screen.queryByTestId("device-intent-executor")).toBeNull());
  });
});
