/**
 * Simple fixture helpers for WalletConnect testing.
 * No complex test doubles - just helpers for jest.mock.
 */

import type { SessionTypes } from "@walletconnect/types";
import type { IDAppCreateAccountResponse } from "../types";
import { IDAppErrorCode, IDAppResponseStatus } from "../types";
import { createFixtureIdAppResponse } from "../bridge/bridge.fixture";

export function createMockSession(network: "testnet" | "mainnet" = "testnet"): SessionTypes.Struct {
  return {
    topic: `mock-topic-${network}-${Date.now()}`,
    expiry: Math.floor(Date.now() / 1000) + 86400,
    acknowledged: true,
    controller: "mock-controller",
    namespaces: {
      ccd: {
        chains: [`ccd:${network}`],
        methods: ["create_account"],
        events: [],
        accounts: [`ccd:${network}:mock-account`],
      },
    },
    requiredNamespaces: {},
    optionalNamespaces: {},
    relay: { protocol: "irn" },
    pairingTopic: "mock-pairing",
    self: {
      publicKey: "mock-public-key",
      metadata: {
        name: "Mock Wallet",
        description: "Mock",
        url: "https://mock.com",
        icons: [],
      },
    },
    peer: {
      publicKey: "mock-peer-key",
      metadata: {
        name: "Mock Peer",
        description: "Mock",
        url: "https://mock.com",
        icons: [],
      },
    },
  };
}

export function createMockPairingResponse(network: "testnet" | "mainnet" = "testnet") {
  const session = createMockSession(network);
  return {
    uri: encodeURIComponent("wc:mock-uri@2?relay-protocol=irn&symKey=mock"),
    approval: jest.fn().mockResolvedValue(session),
  };
}

export function createMockIdAppError(details: string): IDAppCreateAccountResponse {
  return {
    status: IDAppResponseStatus.ERROR,
    message: {
      code: IDAppErrorCode.AccountCreationFailed,
      details,
    },
  };
}

/**
 * Create a mock WalletConnect instance with configurable behavior
 */
export function createMockWalletConnect(config?: {
  hasSession?: boolean;
  sessionNetwork?: "testnet" | "mainnet";
  idAppResponse?: IDAppCreateAccountResponse;
  shouldPairingSucceed?: boolean;
}) {
  const {
    hasSession = true,
    sessionNetwork = "testnet",
    idAppResponse = createFixtureIdAppResponse(),
    shouldPairingSucceed = true,
  } = config ?? {};

  return {
    getSession: jest.fn().mockResolvedValue(hasSession ? createMockSession(sessionNetwork) : null),
    requestCreateAccount: jest.fn().mockResolvedValue(idAppResponse),
    initiatePairing: jest
      .fn()
      .mockResolvedValue(
        shouldPairingSucceed ? createMockPairingResponse(sessionNetwork) : { uri: null },
      ),
  };
}
