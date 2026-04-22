import React from "react";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  getCryptoCurrencyById,
  listSupportedCurrencies,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { screen, render, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { http, HttpResponse, server } from "@tests/server";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import OnboardScreen from "../OnboardScreen";
import { cantonOnboardingPrepareUrl, mockOnboardingPrepareResponse } from "@tests/handlers/canton";

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

const mockParentNavigate = jest.fn();

let previousCurrencyIds: string[] = [];
let currency: CryptoCurrency;
let creatableAccount: Account;
let importableAccount: Account;

/** Redux overrides only — currency fixtures are created in `beforeAll` to avoid mutating global LLC state at import time. */
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

function createScreenProps(): React.ComponentProps<typeof OnboardScreen> {
  const navigation = {
    goBack: jest.fn(),
    getParent: jest.fn(() => ({
      goBack: jest.fn(),
      navigate: mockParentNavigate,
    })),
  };

  const route = {
    key: "canton-onboard-test",
    name: ScreenName.CantonOnboardAccount,
    params: {
      currency,
      accountsToAdd: [creatableAccount, importableAccount],
      isReonboarding: false,
    },
  };

  // Stack injects full navigation/route; we only stub members OnboardScreen reads.
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- test doubles
  return { navigation, route } as unknown as React.ComponentProps<typeof OnboardScreen>;
}

describe("Canton onboarding integration", () => {
  beforeAll(() => {
    previousCurrencyIds = listSupportedCurrencies().map(c => c.id);
    if (!previousCurrencyIds.includes("canton_network_devnet")) {
      setSupportedCurrencies([...previousCurrencyIds, "canton_network_devnet"]);
    }

    currency = getCryptoCurrencyById("canton_network_devnet");
    creatableAccount = { ...genAccount("canton-devnet-integ", { currency }), used: false };
    importableAccount = { ...genAccount("canton-devnet-import", { currency }), used: true };
  });

  afterAll(() => {
    setSupportedCurrencies(previousCurrencyIds);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should complete onboarding and navigate to AddAccounts success", async () => {
    render(<OnboardScreen {...createScreenProps()} />, {
      overrideInitialState: overrideInitialStateWithDevice,
    });

    await waitFor(
      () => {
        expect(mockParentNavigate).toHaveBeenCalledWith(
          NavigatorName.AddAccounts,
          expect.objectContaining({
            screen: ScreenName.AddAccountsSuccess,
            params: expect.objectContaining({
              currency: expect.objectContaining({ id: currency.id }),
            }),
          }),
        );
      },
      { timeout: 20_000 },
    );
  }, 25_000);

  it("should show retry when onboarding prepare fails, then recover when prepare succeeds on retry", async () => {
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

    const { user } = render(<OnboardScreen {...createScreenProps()} />, {
      overrideInitialState: overrideInitialStateWithDevice,
    });

    await waitFor(
      () => {
        expect(screen.getByText("Retry")).toBeOnTheScreen();
      },
      { timeout: 15_000 },
    );

    await user.press(screen.getByText("Retry"));

    await waitFor(
      () => {
        expect(screen.queryByText("Retry")).not.toBeOnTheScreen();
      },
      { timeout: 15_000 },
    );

    // Strict mode / effect timing can issue more than one initial prepare; we only require a new attempt after Retry.
    expect(prepareCallCount).toBeGreaterThanOrEqual(2);
  }, 20_000);
});
