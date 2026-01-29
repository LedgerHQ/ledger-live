import type { SessionTypes } from "@walletconnect/types";
import { CONCORDIUM_CHAIN_IDS } from "../constants";
import {
  ConcordiumWalletConnect,
  setWalletConnect,
  clearWalletConnect,
  getWalletConnect,
} from "./walletConnect";

// Mock SignClient
const mockSignClientInit = jest.fn();
const mockSessionGetAll = jest.fn();
const mockDisconnect = jest.fn();
const mockRequest = jest.fn();
const mockConnect = jest.fn();
const mockPairingGetAll = jest.fn();
const mockPairingDelete = jest.fn();

jest.mock("@walletconnect/sign-client", () => ({
  __esModule: true,
  default: {
    init: () => mockSignClientInit(),
  },
}));

jest.mock("@ledgerhq/live-env", () => ({
  getEnv: jest.fn().mockReturnValue("test-project-id"),
}));

const createMockSession = (overrides: Partial<SessionTypes.Struct> = {}): SessionTypes.Struct =>
  ({
    topic: "test-topic",
    expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    namespaces: {
      ccd: {
        chains: [CONCORDIUM_CHAIN_IDS.Mainnet],
        methods: ["create_account"],
        events: [],
        accounts: [],
      },
    },
    ...overrides,
  }) as SessionTypes.Struct;

describe("walletConnect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearWalletConnect();

    // Default mock implementations
    mockSignClientInit.mockResolvedValue({
      session: { getAll: mockSessionGetAll },
      disconnect: mockDisconnect,
      request: mockRequest,
      connect: mockConnect,
      pairing: { getAll: mockPairingGetAll, delete: mockPairingDelete },
    });
    mockSessionGetAll.mockReturnValue([]);
    mockPairingGetAll.mockReturnValue([]);
  });

  describe("ConcordiumWalletConnect", () => {
    describe("getClient", () => {
      it("should initialize SignClient", async () => {
        const wc = new ConcordiumWalletConnect();
        await wc.getClient();

        expect(mockSignClientInit).toHaveBeenCalled();
      });

      it("should return cached client on subsequent calls", async () => {
        const wc = new ConcordiumWalletConnect();
        const client1 = await wc.getClient();
        const client2 = await wc.getClient();

        expect(client1).toBe(client2);
        expect(mockSignClientInit).toHaveBeenCalledTimes(1);
      });

      it("should throw and reset client on initialization error", async () => {
        mockSignClientInit.mockRejectedValueOnce(new Error("Init failed"));
        const wc = new ConcordiumWalletConnect();

        await expect(wc.getClient()).rejects.toThrow("Init failed");
        expect(wc.client).toBeNull();
      });
    });

    describe("isSessionValid", () => {
      it("should return true for non-expired session", () => {
        const wc = new ConcordiumWalletConnect();
        const session = createMockSession({
          expiry: Math.floor(Date.now() / 1000) + 3600,
        });

        expect(wc.isSessionValid(session)).toBe(true);
      });

      it("should return false for expired session", () => {
        const wc = new ConcordiumWalletConnect();
        const session = createMockSession({
          expiry: Math.floor(Date.now() / 1000) - 3600,
        });

        expect(wc.isSessionValid(session)).toBe(false);
      });
    });

    describe("getSession", () => {
      it("should return null when no sessions exist", async () => {
        mockSessionGetAll.mockReturnValue([]);
        const wc = new ConcordiumWalletConnect();

        const session = await wc.getSession("Mainnet");

        expect(session).toBeNull();
      });

      it("should return session matching network", async () => {
        const mainnetSession = createMockSession({
          topic: "mainnet-session",
          namespaces: {
            ccd: {
              chains: [CONCORDIUM_CHAIN_IDS.Mainnet],
              methods: [],
              events: [],
              accounts: [],
            },
          },
        });
        mockSessionGetAll.mockReturnValue([mainnetSession]);
        const wc = new ConcordiumWalletConnect();

        const session = await wc.getSession("Mainnet");

        expect(session?.topic).toBe("mainnet-session");
      });

      it("should return null when no session matches network", async () => {
        const testnetSession = createMockSession({
          topic: "testnet-session",
          namespaces: {
            ccd: {
              chains: [CONCORDIUM_CHAIN_IDS.Testnet],
              methods: [],
              events: [],
              accounts: [],
            },
          },
        });
        mockSessionGetAll.mockReturnValue([testnetSession]);
        const wc = new ConcordiumWalletConnect();

        const session = await wc.getSession("Mainnet");

        expect(session).toBeNull();
      });

      it("should filter out expired sessions", async () => {
        const expiredSession = createMockSession({
          topic: "expired",
          expiry: Math.floor(Date.now() / 1000) - 3600,
        });
        const validSession = createMockSession({
          topic: "valid",
          expiry: Math.floor(Date.now() / 1000) + 3600,
        });
        mockSessionGetAll.mockReturnValue([expiredSession, validSession]);
        const wc = new ConcordiumWalletConnect();

        const session = await wc.getSession("Mainnet");

        expect(session?.topic).toBe("valid");
      });

      it("should return session with latest expiry", async () => {
        const olderSession = createMockSession({
          topic: "older",
          expiry: Math.floor(Date.now() / 1000) + 3600,
        });
        const newerSession = createMockSession({
          topic: "newer",
          expiry: Math.floor(Date.now() / 1000) + 7200,
        });
        mockSessionGetAll.mockReturnValue([olderSession, newerSession]);
        const wc = new ConcordiumWalletConnect();

        const session = await wc.getSession("Mainnet");

        expect(session?.topic).toBe("newer");
      });

      it("should handle Testnet sessions", async () => {
        const testnetSession = createMockSession({
          topic: "testnet-session",
          namespaces: {
            ccd: {
              chains: [CONCORDIUM_CHAIN_IDS.Testnet],
              methods: [],
              events: [],
              accounts: [],
            },
          },
        });
        mockSessionGetAll.mockReturnValue([testnetSession]);
        const wc = new ConcordiumWalletConnect();

        const session = await wc.getSession("Testnet");

        expect(session?.topic).toBe("testnet-session");
      });
    });

    describe("disconnectAllSessions", () => {
      it("should do nothing when no sessions exist", async () => {
        mockSessionGetAll.mockReturnValue([]);
        const wc = new ConcordiumWalletConnect();

        await wc.disconnectAllSessions();

        expect(mockDisconnect).not.toHaveBeenCalled();
      });

      it("should disconnect all Concordium sessions", async () => {
        const sessions = [
          createMockSession({ topic: "session1" }),
          createMockSession({ topic: "session2" }),
        ];
        mockSessionGetAll.mockReturnValue(sessions);
        mockDisconnect.mockResolvedValue(undefined);
        const wc = new ConcordiumWalletConnect();

        await wc.disconnectAllSessions();

        expect(mockDisconnect).toHaveBeenCalledTimes(2);
        expect(mockDisconnect).toHaveBeenCalledWith(
          expect.objectContaining({
            topic: "session1",
            reason: { code: 6000, message: "User disconnected all sessions" },
          }),
        );
      });

      it("should handle disconnect errors gracefully", async () => {
        const sessions = [createMockSession({ topic: "session1" })];
        mockSessionGetAll.mockReturnValue(sessions);
        mockDisconnect.mockRejectedValue(new Error("Disconnect failed"));
        const wc = new ConcordiumWalletConnect();

        // Should not throw
        await expect(wc.disconnectAllSessions()).resolves.not.toThrow();
      });
    });

    describe("requestCreateAccount", () => {
      it("should send create_account request", async () => {
        const mockResponse = {
          address: "3a9gh23nNY3kH4k3ajaCqAbM8rcbWMor2VhEzQ6qkn2r17UU7w",
        };
        mockRequest.mockResolvedValue(mockResponse);
        const wc = new ConcordiumWalletConnect();

        const params = {
          topic: "test-topic",
          chainId: CONCORDIUM_CHAIN_IDS.Mainnet,
          params: { identityIndex: 0, credNumber: 0, ipIdentity: 1 },
        };

        const result = await wc.requestCreateAccount(params);

        expect(result).toEqual(mockResponse);
        expect(mockRequest).toHaveBeenCalledWith({
          topic: "test-topic",
          chainId: CONCORDIUM_CHAIN_IDS.Mainnet,
          request: {
            method: "create_account",
            params: { identityIndex: 0, credNumber: 0, ipIdentity: 1 },
          },
          expiry: 604800,
        });
      });
    });

    describe("initiatePairing", () => {
      it("should clean up expired pairings before connecting", async () => {
        const expiredPairing = {
          topic: "expired-pairing",
          expiry: Math.floor(Date.now() / 1000) - 3600,
        };
        mockPairingGetAll.mockReturnValue([expiredPairing]);
        mockPairingDelete.mockResolvedValue(undefined);
        mockConnect.mockResolvedValue({ uri: "wc:test", approval: jest.fn() });
        const wc = new ConcordiumWalletConnect();

        await wc.initiatePairing("Mainnet", CONCORDIUM_CHAIN_IDS.Mainnet);

        expect(mockPairingDelete).toHaveBeenCalledWith("expired-pairing", {
          code: 6001,
          message: "Expired",
        });
      });

      it("should not delete non-expired pairings", async () => {
        const validPairing = {
          topic: "valid-pairing",
          expiry: Math.floor(Date.now() / 1000) + 3600,
        };
        mockPairingGetAll.mockReturnValue([validPairing]);
        mockConnect.mockResolvedValue({ uri: "wc:test", approval: jest.fn() });
        const wc = new ConcordiumWalletConnect();

        await wc.initiatePairing("Mainnet", CONCORDIUM_CHAIN_IDS.Mainnet);

        expect(mockPairingDelete).not.toHaveBeenCalled();
      });

      it("should connect with correct namespaces", async () => {
        mockConnect.mockResolvedValue({ uri: "wc:test-uri", approval: jest.fn() });
        const wc = new ConcordiumWalletConnect();

        const result = await wc.initiatePairing("Mainnet", CONCORDIUM_CHAIN_IDS.Mainnet);

        expect(result.uri).toBe("wc:test-uri");
        expect(mockConnect).toHaveBeenCalledWith({
          requiredNamespaces: {
            ccd: {
              methods: ["create_account"],
              chains: [CONCORDIUM_CHAIN_IDS.Mainnet],
              events: [],
            },
          },
        });
      });

      it("should rethrow errors from connect", async () => {
        mockConnect.mockRejectedValue(new Error("Connect failed"));
        const wc = new ConcordiumWalletConnect();

        await expect(wc.initiatePairing("Mainnet", CONCORDIUM_CHAIN_IDS.Mainnet)).rejects.toThrow(
          "Connect failed",
        );
      });
    });
  });

  describe("setWalletConnect", () => {
    it("should create new instance", () => {
      const wc = setWalletConnect();

      expect(wc).toBeInstanceOf(ConcordiumWalletConnect);
    });

    it("should return same instance on subsequent calls", () => {
      const wc1 = setWalletConnect();
      const wc2 = setWalletConnect();

      expect(wc1).toBe(wc2);
    });
  });

  describe("getWalletConnect", () => {
    it("should return null when not initialized", () => {
      const wc = getWalletConnect();

      expect(wc).toBeNull();
    });

    it("should return instance after setWalletConnect", () => {
      setWalletConnect();
      const wc = getWalletConnect();

      expect(wc).toBeInstanceOf(ConcordiumWalletConnect);
    });
  });

  describe("clearWalletConnect", () => {
    it("should reset the wallet connect instance", () => {
      setWalletConnect();
      expect(getWalletConnect()).not.toBeNull();

      clearWalletConnect();
      expect(getWalletConnect()).toBeNull();
    });
  });
});
