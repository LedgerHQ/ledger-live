import React from "react";
import { act, cleanup, render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { http, HttpResponse } from "msw";
import { server } from "tests/server";
import cantonHandlers, {
  CANTON_DEVNET_GATEWAY,
  CANTON_DEVNET_NODE_ID,
  CANTON_DEVNET_ONBOARDING_PREPARE_RE,
  MOCK_CANTON_PUBLIC_KEY_HEX,
} from "./cantonHandlers";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/impl";
import coinConfig from "@ledgerhq/coin-canton/config";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import OnboardModal from "../index";
import {
  createMockDevice,
  generateOnboardModalProps,
  generateOnboardModalState,
} from "../__tests__/testUtils";

jest.mock("@ledgerhq/live-common/hw/deviceAccess", () => ({
  withDevice: jest.fn(
    () => (job: (transport: unknown) => unknown) => job({ decorateAppAPIMethods: jest.fn() }),
  ),
}));

jest.mock("~/renderer/extra/Snow", () => ({
  __esModule: true,
  default: () => null,
  isSnowTime: () => false,
}));

jest.mock("@ledgerhq/coin-canton/signer", () => ({
  __esModule: true,
  default: jest.fn(
    () =>
      (_deviceId: string, { path }: { path: string }) =>
        Promise.resolve({
          publicKey: MOCK_CANTON_PUBLIC_KEY_HEX,
          address: "canton_mock_address_integ",
          path,
        }),
  ),
}));

jest.mock("@ledgerhq/coin-canton/common-logic/transaction/sign", () => ({
  __esModule: true,
  signTransaction: jest.fn().mockResolvedValue({
    signature: "cc".repeat(66),
  }),
}));

jest.mock(
  "@ledgerhq/hw-app-canton",
  () => ({
    __esModule: true,
    default: jest.fn(() => ({
      getAppConfiguration: jest.fn().mockResolvedValue({ version: "3.0.0" }),
      getAddress: jest.fn().mockImplementation((path: string) =>
        Promise.resolve({
          publicKey: MOCK_CANTON_PUBLIC_KEY_HEX,
          address: "canton_mock_address_integ",
          path,
        }),
      ),
      signTransaction: jest.fn().mockResolvedValue({
        signature: "cc".repeat(66),
      }),
    })),
  }),
  { virtual: true },
);

function cantonDevnetCurrency(): CryptoCurrency {
  const currency = getCryptoCurrencyById("canton_network_devnet");
  if (!currency) {
    throw new Error(
      "canton_network_devnet is missing; setSupportedCurrencies must run in beforeAll for this suite",
    );
  }
  return currency;
}

function mergeCantonIntegInitialState(
  device: ReturnType<typeof createMockDevice>,
  extra: Record<string, unknown> & { settings?: typeof SETTINGS_INITIAL_STATE } = {},
) {
  const { settings: extraSettings, ...rest } = extra;
  return {
    ...generateOnboardModalState(device),
    ...withFlagOverrides({ llmModularDrawer: { enabled: false } }),
    ...rest,
    settings: {
      ...SETTINGS_INITIAL_STATE,
      ...extraSettings,
    },
  };
}

describe("OnboardModal Integration", () => {
  const mockDevice = createMockDevice();
  let previousCantonNodeIdOverride: string;

  beforeAll(async () => {
    previousCantonNodeIdOverride = getEnv("CANTON_NODE_ID_OVERRIDE") ?? "";
    setEnv("CANTON_NODE_ID_OVERRIDE", "");

    setSupportedCurrencies(["canton_network_devnet"]);
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      networkType: "devnet",
      gatewayUrl: CANTON_DEVNET_GATEWAY,
      nodeId: CANTON_DEVNET_NODE_ID,
      useGateway: true,
      nativeInstrumentId: "Amulet",
    }));

    await getCurrencyBridge(getCryptoCurrencyById("canton_network_devnet"));
  });

  afterAll(() => {
    setEnv("CANTON_NODE_ID_OVERRIDE", previousCantonNodeIdOverride);
    setSupportedCurrencies([]);
  });

  beforeEach(() => {
    server.resetHandlers();
    server.use(...cantonHandlers);

    if (!document.getElementById("modals")) {
      const modalsRoot = document.createElement("div");
      modalsRoot.id = "modals";
      document.body.appendChild(modalsRoot);
    }
  });

  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
    document.getElementById("modals")?.remove();
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
  });

  it("should complete onboarding and show finish", async () => {
    const defaultProps = generateOnboardModalProps(cantonDevnetCurrency());
    const initialState = mergeCantonIntegInitialState(mockDevice);

    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    expect(screen.getByText("Set up your new Canton account by clicking Continue")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(
      () => {
        expect(screen.getByTestId("add-accounts-finish-close-button")).toBeVisible();
      },
      { timeout: 20_000 },
    );
  }, 25_000);

  it("should show try again when onboarding prepare fails", async () => {
    server.use(
      http.post(CANTON_DEVNET_ONBOARDING_PREPARE_RE, () =>
        HttpResponse.json({ error: "gateway error" }, { status: 500 }),
      ),
    );

    const defaultProps = generateOnboardModalProps(cantonDevnetCurrency());
    const initialState = mergeCantonIntegInitialState(mockDevice);

    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: /try again/i })).toBeVisible();
      },
      { timeout: 15_000 },
    );
  }, 20_000);
});
