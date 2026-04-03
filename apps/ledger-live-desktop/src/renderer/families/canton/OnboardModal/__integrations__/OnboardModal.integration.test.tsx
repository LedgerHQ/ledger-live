import React from "react";
import { act, cleanup, render, screen, waitFor } from "tests/testSetup";
import { http, HttpResponse } from "msw";
import { server } from "tests/server";
import cantonHandlers, {
  CANTON_DEVNET_GATEWAY,
  CANTON_DEVNET_NODE_ID,
  MOCK_CANTON_PUBLIC_KEY_HEX,
} from "./cantonHandlers";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import coinConfig from "@ledgerhq/coin-canton/config";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/renderer/reducers/settings";
import OnboardModal from "../index";
import {
  createCantonIntegModalState,
  createCantonIntegUserProps,
  createMockDevice,
} from "../__tests__/testUtils";

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

const prepareUrl = `${CANTON_DEVNET_GATEWAY}/v1/node/${CANTON_DEVNET_NODE_ID}/onboarding/prepare`;

const cantonIntegSettings = {
  ...SETTINGS_INITIAL_STATE,
  overriddenFeatureFlags: {
    cantonSkipPreapprovalStep: { enabled: true },
  },
};

function mergeCantonIntegInitialState(
  device: ReturnType<typeof createMockDevice>,
  extra: Record<string, unknown> & { settings?: typeof SETTINGS_INITIAL_STATE } = {},
) {
  const { settings: extraSettings, ...rest } = extra;
  return {
    ...createCantonIntegModalState(device),
    ...rest,
    settings: {
      ...cantonIntegSettings,
      ...extraSettings,
      overriddenFeatureFlags: {
        ...cantonIntegSettings.overriddenFeatureFlags,
        ...(extraSettings?.overriddenFeatureFlags ?? {}),
        cantonSkipPreapprovalStep: { enabled: true },
      },
    },
  };
}

describe("OnboardModal Integration", () => {
  const mockDevice = createMockDevice();

  beforeAll(() => {
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
    setSupportedCurrencies([]);
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
    const currency = getCryptoCurrencyById("canton_network_devnet");
    const defaultProps = createCantonIntegUserProps(currency);
    const initialState = mergeCantonIntegInitialState(mockDevice);

    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    expect(screen.getByText("Set up your new Canton account by clicking Continue")).toBeVisible();

    const reqs: string[] = [];
    server.events.on("request:start", ({ request }) => {
      reqs.push(request.url);
      console.log("MSW intercepted:", request.url);
    });

    await user.click(screen.getByRole("button", { name: /continue/i }));

    try {
      await waitFor(
        () => {
          expect(screen.getByTestId("add-accounts-finish-close-button")).toBeVisible();
        },
        { timeout: 5000 },
      );
    } catch (e) {
      console.log("DOM AFTER FAIL:", document.body.innerHTML, reqs);
      throw e;
    }
  }, 25_000);

  it("should show try again when onboarding prepare fails", async () => {
    server.use(
      http.post(prepareUrl, () => HttpResponse.json({ error: "gateway error" }, { status: 500 })),
    );

    const currency = getCryptoCurrencyById("canton_network_devnet");
    const defaultProps = createCantonIntegUserProps(currency);
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
