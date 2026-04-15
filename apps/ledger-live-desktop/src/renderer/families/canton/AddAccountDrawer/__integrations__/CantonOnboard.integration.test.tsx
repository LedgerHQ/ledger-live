import React from "react";
import { act, cleanup, render, screen, waitFor } from "tests/testSetup";
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
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { CantonAccount } from "@ledgerhq/coin-canton/types";
import type { Account } from "@ledgerhq/types-live";
import coinConfig from "@ledgerhq/coin-canton/config";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import CantonOnboard from "../CantonOnboard";
import { createMockAccount } from "../../__tests__/testUtils";

jest.mock("@ledgerhq/live-common/hw/deviceAccess", () => ({
  withDevice: jest.fn(() => (job: (transport: unknown) => unknown) => job({})),
}));

jest.mock("~/renderer/extra/Snow", () => ({
  __esModule: true,
  default: () => null,
  isSnowTime: () => false,
}));

jest.mock(
  "@ledgerhq/hw-app-canton",
  () => {
    return {
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
    };
  },
  { virtual: true },
);

function createMockDevice(overrides: Partial<Device> = {}): Device {
  return {
    deviceId: "test-device-id",
    modelId: DeviceModelId.nanoS,
    wired: false,
    ...overrides,
  };
}

function buildInitialReduxState(device: Device) {
  return {
    devices: { currentDevice: device, devices: [device] },
    settings: { ...SETTINGS_INITIAL_STATE },
  };
}

function cantonDevnetCurrency(): CryptoCurrency {
  const currency = getCryptoCurrencyById("canton_network_devnet");
  if (!currency) {
    throw new Error(
      "canton_network_devnet is missing; setSupportedCurrencies must run in beforeAll for this suite",
    );
  }
  return currency;
}

function buildCantonAccount(
  currency: CryptoCurrency,
  overrides: Partial<CantonAccount> = {},
): Account {
  return createMockAccount({
    currency,
    used: false,
    id: `js:2:${currency.id}:creatable:canton`,
    cantonResources: {
      isOnboarded: false,
      instrumentUtxoCounts: {},
      pendingTransferProposals: [],
    },
    ...overrides,
  } as Partial<Account>);
}

function buildProps(currency: CryptoCurrency) {
  const creatableAccount = buildCantonAccount(currency);

  return {
    currency,
    selectedAccounts: [creatableAccount],
    onComplete: jest.fn(),
  };
}

describe("CantonOnboard (MAD) Integration", () => {
  const mockDevice = createMockDevice();
  let previousCantonNodeIdOverride: string;

  beforeAll(() => {
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
  });

  afterAll(() => {
    setEnv("CANTON_NODE_ID_OVERRIDE", previousCantonNodeIdOverride);
    setSupportedCurrencies([]);
  });

  beforeEach(() => {
    server.resetHandlers();
    server.use(...cantonHandlers);
  });

  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
    // Flush pending microtasks to prevent "import after teardown" warnings from undici/MSW
    await act(async () => {
      await new Promise(r => setTimeout(r, 100));
    });
  });

  it("should render initial onboard state with continue button", () => {
    const props = buildProps(cantonDevnetCurrency());
    const initialState = buildInitialReduxState(mockDevice);

    render(<CantonOnboard {...props} />, { initialState });

    expect(screen.getByRole("button", { name: /continue/i })).toBeVisible();
  });

  it("should complete onboarding and call onComplete", async () => {
    const props = buildProps(cantonDevnetCurrency());
    const initialState = buildInitialReduxState(mockDevice);

    const { user } = render(<CantonOnboard {...props} />, { initialState });

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(
      () => {
        expect(
          screen.getByText("Your new Canton account has been created and onboarded."),
        ).toBeVisible();
      },
      { timeout: 20_000 },
    );

    // Click continue on success to add accounts and trigger onComplete
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(props.onComplete).toHaveBeenCalled();
  }, 25_000);

  it("should show try again when onboarding prepare fails", async () => {
    server.use(
      http.post(CANTON_DEVNET_ONBOARDING_PREPARE_RE, () =>
        HttpResponse.json({ error: "gateway error" }, { status: 500 }),
      ),
    );

    const props = buildProps(cantonDevnetCurrency());
    const initialState = buildInitialReduxState(mockDevice);

    const { user } = render(<CantonOnboard {...props} />, { initialState });

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: /try again/i })).toBeVisible();
      },
      { timeout: 15_000 },
    );
  }, 20_000);

  it("should show reonboarding warning when isReonboarding", () => {
    const currency = cantonDevnetCurrency();
    const accountToReonboard = buildCantonAccount(currency, {
      id: `js:2:${currency.id}:reonboard:canton`,
      used: true,
    });
    const initialState = buildInitialReduxState(mockDevice);

    render(
      <CantonOnboard
        currency={currency}
        selectedAccounts={[]}
        onComplete={jest.fn()}
        isReonboarding
        accountToReonboard={accountToReonboard}
      />,
      { initialState },
    );

    expect(screen.getByRole("button", { name: /continue/i })).toBeVisible();
  });
});
