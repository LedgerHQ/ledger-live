/**
 * Integration test for OnboardModal.
 * MSW mocks HTTP and WebSocket (WCRelay)
 */
import React from "react";
import { cleanup, render, screen, waitFor } from "tests/testSetup";
import { server } from "tests/server";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import coinConfig from "@ledgerhq/coin-concordium/config";
import OnboardModal from "../index";
import {
  createConcordiumAccount,
  createDefaultProps,
  createInitialState,
  createMockDevice,
  SESSION_TOPIC,
  T,
  WAIT_OPTS,
} from "./testUtils";

setSupportedCurrencies(["concordium"]);

// HTTP (submitCredential) and WebSocket (WC relay) are mocked via tests/handlers/concordium.ts.
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
        () => new Promise(resolve => setTimeout(() => resolve("bb".repeat(64)), T + 200)),
      ),
      getAddress: jest.fn().mockResolvedValue({
        publicKey: "aa".repeat(32),
        address: "test",
      }),
    })),
  }),
  { virtual: true },
);

// Test data — matches bridge fixture structure for deserializeCredentialDeploymentTransaction
const TEST_SERIALIZED_CDT = {
  expiry: Math.floor(Date.now() / 1000) + 60 * 60,
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
const mockDevice = createMockDevice();

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

describe("OnboardModal Integration", () => {
  const creatableAccount = createConcordiumAccount(currency, { used: false });
  const defaultProps = createDefaultProps(currency, creatableAccount);
  const initialState = createInitialState(mockDevice);

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      networkType: "mainnet",
      grpcUrl: "https://ccd-node-mainnet.coin.ledger.com",
      grpcPort: 443,
      proxyUrl: "https://ccd-wallet-proxy-mainnet.coin.ledger.com",
      minReserve: 0,
    }));
  });

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
        expect(
          screen.getByText(/your concordium account has been created successfully/i),
        ).toBeTruthy();
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
