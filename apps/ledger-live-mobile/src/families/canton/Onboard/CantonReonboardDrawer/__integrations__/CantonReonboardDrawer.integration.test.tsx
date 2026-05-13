import React from "react";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  getCryptoCurrencyById,
  listSupportedCurrencies,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { screen, render, waitFor } from "@tests/test-renderer";
import { http, HttpResponse, server } from "@tests/server";
import coinConfig from "@ledgerhq/coin-canton/config";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { State } from "~/reducers/types";
import CantonReonboardDrawer from "../index";
import {
  CANTON_DEVNET_GATEWAY,
  CANTON_DEVNET_NODE_ID,
  cantonOnboardingPrepareUrl,
  mockOnboardingPrepareResponse,
} from "@tests/handlers/canton";

jest.mock("@ledgerhq/live-common/hw/deviceAccess", () => ({
  withDevice: jest.fn(() => (job: (transport: unknown) => unknown) => job({})),
}));

jest.mock(
  "@ledgerhq/hw-app-canton",
  () => {
    const cantonHandlers = jest.requireActual("@tests/handlers/canton");
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- requireActual is untyped
    const pubKey = (cantonHandlers as { MOCK_CANTON_PUBLIC_KEY_HEX: string })
      .MOCK_CANTON_PUBLIC_KEY_HEX;
    return {
      __esModule: true,
      default: jest.fn(() => ({
        getAppConfiguration: jest.fn().mockResolvedValue({ version: "3.0.0" }),
        getAddress: jest.fn().mockImplementation((path: string) =>
          Promise.resolve({
            publicKey: pubKey,
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

jest.mock("~/components/DeviceActionModal", () => ({
  __esModule: true,
  default: () => null,
}));

let previousCurrencyIds: string[] = [];
let currency: CryptoCurrency;
let accountToReonboard: Account;

function overrideInitialStateWithDevice(state: State): State {
  return {
    ...state,
    settings: {
      ...state.settings,
      lastConnectedDevice: {
        deviceId: "test-device-id",
        modelId: DeviceModelId.nanoX,
        wired: false,
      },
    },
  };
}

describe("CantonReonboardDrawer integration", () => {
  beforeAll(() => {
    previousCurrencyIds = listSupportedCurrencies().map(c => c.id);
    if (!previousCurrencyIds.includes("canton_network_devnet")) {
      setSupportedCurrencies([...previousCurrencyIds, "canton_network_devnet"]);
    }

    currency = getCryptoCurrencyById("canton_network_devnet");
    accountToReonboard = { ...genAccount("canton-devnet-reonboard", { currency }), used: true };

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
    setSupportedCurrencies(previousCurrencyIds);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  async function acceptDisclaimer(user: ReturnType<typeof render>["user"]) {
    await user.press(screen.getByTestId("canton-disclaimer-agree-row"));
    await waitFor(() => {
      expect(screen.getByText("Agree")).not.toBeDisabled();
    });
    await user.press(screen.getByText("Agree"));
  }

  it("should show the disclaimer first and require agreement before reonboarding", async () => {
    const onClose = jest.fn();

    const { user } = render(
      <CantonReonboardDrawer
        isOpen
        currency={currency}
        accountToReonboard={accountToReonboard}
        onClose={onClose}
      />,
      { overrideInitialState: overrideInitialStateWithDevice },
    );

    expect(screen.getByText("Setup Canton Network")).toBeOnTheScreen();
    expect(screen.queryByText("Confirm")).not.toBeOnTheScreen();

    await acceptDisclaimer(user);

    await waitFor(() => {
      expect(screen.getByText("Confirm")).toBeOnTheScreen();
    });
  });

  it("Cancel from disclaimer closes the drawer without reonboarding", async () => {
    const onClose = jest.fn();

    const { user } = render(
      <CantonReonboardDrawer
        isOpen
        currency={currency}
        accountToReonboard={accountToReonboard}
        onClose={onClose}
      />,
      { overrideInitialState: overrideInitialStateWithDevice },
    );

    await user.press(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should complete reonboarding and call onClose", async () => {
    const onClose = jest.fn();

    const { user } = render(
      <CantonReonboardDrawer
        isOpen
        currency={currency}
        accountToReonboard={accountToReonboard}
        onClose={onClose}
      />,
      { overrideInitialState: overrideInitialStateWithDevice },
    );

    await acceptDisclaimer(user);

    await user.press(screen.getByText("Confirm"));

    await waitFor(
      () => {
        expect(onClose).toHaveBeenCalled();
      },
      { timeout: 20_000 },
    );
  }, 25_000);

  it("should show retry when prepare fails, then recover on retry", async () => {
    let prepareCallCount = 0;
    server.use(
      http.post(cantonOnboardingPrepareUrl, () => {
        prepareCallCount += 1;
        if (prepareCallCount === 1) {
          return HttpResponse.json({ error: "gateway error" }, { status: 500 });
        }
        return HttpResponse.json(mockOnboardingPrepareResponse);
      }),
    );

    const onClose = jest.fn();

    const { user } = render(
      <CantonReonboardDrawer
        isOpen
        currency={currency}
        accountToReonboard={accountToReonboard}
        onClose={onClose}
      />,
      { overrideInitialState: overrideInitialStateWithDevice },
    );

    await acceptDisclaimer(user);

    await user.press(screen.getByText("Confirm"));

    await waitFor(
      () => {
        expect(screen.getByText("Try again")).toBeOnTheScreen();
      },
      { timeout: 15_000 },
    );

    await user.press(screen.getByText("Try again"));

    await waitFor(
      () => {
        expect(onClose).toHaveBeenCalled();
      },
      { timeout: 20_000 },
    );

    expect(prepareCallCount).toBeGreaterThanOrEqual(2);
  }, 30_000);
});
