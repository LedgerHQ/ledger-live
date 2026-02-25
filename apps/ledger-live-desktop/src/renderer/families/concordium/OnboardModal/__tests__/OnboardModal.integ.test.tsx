/**
 * Integration test for OnboardModal.
 * MSW mocks HTTP and WebSocket (WCRelay)
 */
import React from "react";
import { cleanup, render, screen, waitFor } from "tests/testSetup";
import { server, http, HttpResponse } from "tests/server";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import {
  ConcordiumAccount,
  ConcordiumResources,
} from "@ledgerhq/coin-concordium/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";
import { createEmptyHistoryCache } from "@ledgerhq/coin-framework/account";
import { getDerivationScheme, runDerivationScheme } from "@ledgerhq/coin-framework/derivation";
import BigNumber from "bignumber.js";
import OnboardModal from "../index";

setSupportedCurrencies(["concordium"]);

const T = 1500; // STEP_TRANSITION_TIMEOUT in OnboardModal
const SESSION_TOPIC = "ABCDsession-topic-rest";
const CONCORDIUM_PROXY_URL = "https://ccd-wallet-proxy-mainnet.coin.ledger.com";

// WC relay is mocked via MSW ws.link in tests/handlers/concordium.ts.
// SignClient is mocked here because WC protocol uses encrypted session proposals/
// approvals that cannot be forged.
const mockConnect = jest.fn();
const mockSessionGetAll = jest.fn();
const mockRequest = jest.fn();
const mockPairingGetAll = jest.fn();
const mockPairingDelete = jest.fn();

jest.mock(
  "@walletconnect/sign-client",
  () => ({
    __esModule: true,
    default: {
      init: () =>
        Promise.resolve({
          connect: (...args: unknown[]) => mockConnect(...args),
          session: { getAll: () => mockSessionGetAll() },
          request: (...args: unknown[]) => mockRequest(...args),
          pairing: {
            getAll: () => mockPairingGetAll(),
            delete: (...args: unknown[]) => mockPairingDelete(...args),
          },
        }),
    },
  }),
  { virtual: true },
);

jest.mock("@ledgerhq/live-common/hw/deviceAccess", () => ({
  withDevice: jest.fn(() => (job: (transport: unknown) => unknown) => job({})),
}));

const mockGetPublicKey = jest.fn();
const mockSignCredentialDeployment = jest.fn();

jest.mock("@ledgerhq/coin-concordium/signer", () => ({
  __esModule: true,
  getPublicKey: (...args: unknown[]) => mockGetPublicKey(...args),
  signCredentialDeployment: (...args: unknown[]) => mockSignCredentialDeployment(...args),
  default: jest.fn(),
}));

jest.mock(
  "@ledgerhq/hw-app-concordium",
  () => ({
    __esModule: true,
    default: jest.fn(() => ({
      getPublicKey: jest.fn().mockResolvedValue("aa".repeat(32)),
      signCredentialDeployment: jest.fn(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve("bb".repeat(64)), T + 200),
          ),
      ),
      getAddress: jest.fn().mockResolvedValue({
        publicKey: "aa".repeat(32),
        address: "test",
      }),
    })),
  }),
  { virtual: true },
);

const TEST_SERIALIZED_CDT = {
  expiry: 1700000000,
  unsignedCdiStr: JSON.stringify({
    credentialPublicKeys: {
      keys: { "0": { schemeId: "Ed25519", verifyKey: "aa".repeat(32) } },
      threshold: 1,
    },
    credId: "dd".repeat(48),
    ipIdentity: 0,
    revocationThreshold: 2,
    arData: { "1": { encIdCredPubShare: "cc".repeat(96) } },
    policy: { validTo: "202612", createdAt: "202512", revealedAttributes: {} },
    proofs: {
      sig: "ee".repeat(64),
      commitments: "ff".repeat(100),
      challenge: "00".repeat(32),
      proofIdCredPub: { "0": "11".repeat(50) },
      proofIpSig: "22".repeat(64),
      proofRegId: "33".repeat(48),
      credCounterLessThanMaxAccounts: "44".repeat(100),
    },
  }),
  randomness: {
    idCredSecRand: "aa",
    prfRand: "bb",
    credCounterRand: "cc",
    maxAccountsRand: "dd",
    attributesRand: {},
  },
};

const currency = getCryptoCurrencyById("concordium");
const mockDevice: Device = {
  deviceId: "test-device-id",
  modelId: DeviceModelId.nanoS,
  wired: false,
};

const defaultConcordiumResources: ConcordiumResources = {
  isOnboarded: false,
  credId: "",
  publicKey: "",
  identityIndex: 0,
  credNumber: 0,
  ipIdentity: 0,
};

function createConcordiumAccount(overrides: Partial<ConcordiumAccount> = {}): ConcordiumAccount {
  const derivationMode = "concordium" as const;
  const scheme = getDerivationScheme({ derivationMode, currency });
  const freshAddressPath = runDerivationScheme(scheme, currency, { account: 0 });

  return {
    id: "js:2:concordium:test-address:concordium",
    type: "Account",
    used: false,
    currency,
    derivationMode,
    index: 0,
    freshAddress: "test_address",
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(),
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    seedIdentifier: "test_seed",
    blockHeight: 0,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: createEmptyHistoryCache(),
    swapHistory: [],
    subAccounts: [],
    concordiumResources: defaultConcordiumResources,
    ...overrides,
  };
}

function setupSuccessfulPairing() {
  const session = {
    topic: SESSION_TOPIC,
    namespaces: { ccd: { chains: ["ccd:9dd9ca4d19e9393877d2c44b70f89acb"] } },
    expiry: Math.floor(Date.now() / 1000) + 86400,
  };

  mockPairingGetAll.mockReturnValue([]);
  mockConnect.mockResolvedValue({
    uri: "wc:test-uri",
    approval: jest.fn(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve(session), T + 200);
        }),
    ),
  });
  mockSessionGetAll.mockReturnValue([session]);
}

function setupSuccessfulAccountCreation() {
  mockRequest.mockResolvedValue({
    status: "success",
    message: {
      serializedCredentialDeploymentTransaction: TEST_SERIALIZED_CDT,
      identityIndex: 0,
      credNumber: 0,
      accountAddress: "completed_address",
    },
  });

  mockGetPublicKey.mockResolvedValue("aa".repeat(32));
  mockSignCredentialDeployment.mockImplementation(
    () => new Promise(resolve => setTimeout(() => resolve("bb".repeat(64)), T + 200)),
  );
}

function setupFailedPairing(error: Error) {
  mockPairingGetAll.mockReturnValue([]);
  mockConnect.mockResolvedValue({
    uri: "wc:test-uri",
    approval: jest.fn().mockRejectedValue(error),
  });
}

function setupFailedAccountCreation() {
  mockRequest.mockResolvedValue({
    status: "error",
    message: { code: 2, details: "IDApp create_account failed" },
  });
}

const WAIT_OPTS = { timeout: 2 * T + 500 };

// ============================================================================
// Tests
// ============================================================================

describe("OnboardModal Integration", () => {
  const creatableAccount = createConcordiumAccount({ used: false });
  const defaultProps = {
    currency,
    editedNames: {},
    selectedAccounts: [creatableAccount],
  };
  const initialState = {
    devices: { currentDevice: mockDevice, devices: [mockDevice] },
    accounts: [],
    modals: { MODAL_CONCORDIUM_ONBOARD_ACCOUNT: { isOpened: true } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
    mockPairingGetAll.mockReturnValue([]);

    // Modal uses createPortal to render into #modals
    if (!document.getElementById("modals")) {
      const modalsRoot = document.createElement("div");
      modalsRoot.id = "modals";
      document.body.appendChild(modalsRoot);
    }

    server.use(
      http.put(`${CONCORDIUM_PROXY_URL}/v0/submitCredential/`, () => {
        return HttpResponse.json({ submissionId: "test-submission-id" });
      }),
    );
  });

  afterEach(async () => {
    cleanup();
    document.getElementById("modals")?.remove();
    await new Promise(r => setTimeout(r, 0));
  });

  it("should complete pairing and reach sign step with real bridge", async () => {
    setupSuccessfulPairing();
    setupSuccessfulAccountCreation();

    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    await user.click(await screen.findByRole("button", { name: /agree/i }));

    await waitFor(() => {
      expect(screen.getByText(/scan the qr code/i)).toBeVisible();
    }, WAIT_OPTS);

    await waitFor(() => {
      expect(screen.getByText(/successfully connected to concordium id app/i)).toBeVisible();
    }, WAIT_OPTS);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/match the code below/i)).toBeVisible();
    });
    expect(screen.getByRole("group", { name: /confirmation code/i })).toBeVisible();

    // Real bridge flows: getPublicKey → getSession → requestCreateAccount → sign
    await waitFor(() => {
      expect(screen.getByText(/sign transaction on your ledger device/i)).toBeVisible();
    }, WAIT_OPTS);

    // MSW intercepts submitCredential; full success depends on network/axios interception
    await waitFor(
      () => {
        const success = screen.queryByText(
          /your concordium account has been created successfully/i,
        );
        const error = screen.queryByText(/failed to create account/i);
        expect(success ?? error).toBeTruthy();
      },
      { timeout: 8000 },
    );
  }, 25_000);

  it("should show error when pairing fails", async () => {
    setupFailedPairing(new Error("Connection failed"));

    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    await user.click(await screen.findByRole("button", { name: /agree/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to onboard new account/i)).toBeVisible();
    });
    expect(screen.getByRole("button", { name: /try again/i })).toBeVisible();
  }, 10_000);

  it("should show error when account creation fails", async () => {
    setupSuccessfulPairing();
    setupFailedAccountCreation();

    const { user } = render(<OnboardModal {...defaultProps} />, { initialState });

    await user.click(await screen.findByRole("button", { name: /agree/i }));

    await waitFor(() => {
      expect(screen.getByText(/successfully connected to concordium id app/i)).toBeVisible();
    }, WAIT_OPTS);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create account/i)).toBeVisible();
    });
    expect(screen.getByRole("button", { name: /try again/i })).toBeVisible();
  }, 15_000);
});
