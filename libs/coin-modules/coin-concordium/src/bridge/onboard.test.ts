import { LockedDeviceError, TransportStatusError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { firstValueFrom, toArray } from "rxjs";
import { AccountOnboardStatus, ConcordiumPairingStatus } from "../types";
import {
  createFixtureAccount,
  createFixtureCurrency,
  VALID_ADDRESS,
  CRED_ID,
} from "../test/fixtures";
import { buildOnboardAccount, buildPairWalletConnect } from "./onboard";
import {
  createFixtureSigner,
  createFixtureSignerContext,
  createFixtureIdAppResponse,
} from "./bridge.fixture";

// Mock dependencies
const mockGetSession = jest.fn();
const mockRequestCreateAccount = jest.fn();
const mockInitiatePairing = jest.fn();

jest.mock("../network/walletConnect", () => ({
  getWalletConnect: jest.fn(() => ({
    getSession: mockGetSession,
    requestCreateAccount: mockRequestCreateAccount,
    initiatePairing: mockInitiatePairing,
  })),
}));

jest.mock("../signer", () => ({
  // 64 hex chars = 32 bytes, Ed25519 public key
  getPublicKey: jest.fn().mockResolvedValue("aa".repeat(32)),
  // 128 hex chars = 64 bytes, Ed25519 signature
  signCredentialDeployment: jest.fn().mockResolvedValue("bb".repeat(64)),
}));

jest.mock("../network/utils", () => ({
  getConcordiumNetwork: jest.fn().mockReturnValue("Mainnet"),
  buildSubmitCredentialData: jest.fn().mockReturnValue({ v: 0, value: {} }),
  deserializeCredentialDeploymentTransaction: jest.fn().mockReturnValue({
    // 96 hex chars = 48 bytes, credential ID
    credId: "cc".repeat(48),
    ipIdentity: 0,
    credentialPublicKeys: { keys: {}, threshold: 1 },
    policy: { validTo: "202612", createdAt: "202512", revealedAttributes: {} },
    proofs: {},
    // Unix timestamp ~2023-11-15
    expiry: 1700000000n,
  }),
}));

jest.mock("../network/proxyClient", () => ({
  submitCredential: jest.fn().mockResolvedValue({ submissionId: "test-submission-id" }),
}));

describe("onboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("buildOnboardAccount", () => {
    const setupSuccessfulMocks = () => {
      mockGetSession.mockResolvedValue({ topic: "test-topic" });
      mockRequestCreateAccount.mockResolvedValue(createFixtureIdAppResponse());
    };

    it("should emit INIT, PREPARE, SIGN statuses and final result", async () => {
      // GIVEN
      setupSuccessfulMocks();
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      // WHEN
      const observable = onboardAccount(currency, "test-device", account);
      const events = await firstValueFrom(observable.pipe(toArray()));

      // THEN
      const statuses = events.filter(e => "status" in e).map(e => e.status);
      expect(statuses).toContain(AccountOnboardStatus.INIT);
      expect(statuses).toContain(AccountOnboardStatus.PREPARE);
      expect(statuses).toContain(AccountOnboardStatus.SIGN);
      const finalEvent = events[events.length - 1];
      expect(finalEvent).toHaveProperty("account");
    });

    it("should return account with concordiumResources on success", async () => {
      // GIVEN
      setupSuccessfulMocks();
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      // WHEN
      const observable = onboardAccount(currency, "test-device", account);
      const events = await firstValueFrom(observable.pipe(toArray()));

      // THEN
      const result = events[events.length - 1];
      expect(result.account).not.toBeUndefined();
      expect(result.account.freshAddress).toBe(VALID_ADDRESS);
      expect(result.account.concordiumResources).toMatchObject({
        credId: CRED_ID,
        credNumber: 0,
        identityIndex: 0,
        ipIdentity: 0,
        isOnboarded: true,
      });
    });

    it("should throw error when WalletConnect is not available", async () => {
      // GIVEN
      const { getWalletConnect } = jest.requireMock("../network/walletConnect");
      getWalletConnect.mockReturnValueOnce(null);
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      // WHEN
      const observable = onboardAccount(currency, "test-device", account);

      // THEN
      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow(
        "WalletConnect context not available",
      );
    });

    it("should throw error when no WalletConnect session exists", async () => {
      // GIVEN
      mockGetSession.mockResolvedValue(null);
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      // WHEN
      const observable = onboardAccount(currency, "test-device", account);

      // THEN
      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow(
        "No active WalletConnect session",
      );
    });

    it("should throw error when IDApp returns error status", async () => {
      // GIVEN
      mockGetSession.mockResolvedValue({ topic: "test-topic" });
      mockRequestCreateAccount.mockResolvedValue({
        status: "error",
        message: { details: "Identity verification failed" },
      });
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      // WHEN
      const observable = onboardAccount(currency, "test-device", account);

      // THEN
      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow(
        "IDApp create_account failed: Identity verification failed",
      );
    });

    it("should throw error when response is missing serializedCredentialDeploymentTransaction", async () => {
      // GIVEN
      mockGetSession.mockResolvedValue({ topic: "test-topic" });
      mockRequestCreateAccount.mockResolvedValue({
        status: "success",
        message: { accountAddress: VALID_ADDRESS },
      });
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      // WHEN
      const observable = onboardAccount(currency, "test-device", account);

      // THEN
      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow(
        "serializedCredentialDeploymentTransaction is missing",
      );
    });

    it("should throw error when signature is empty", async () => {
      // GIVEN
      setupSuccessfulMocks();
      const { signCredentialDeployment } = jest.requireMock("../signer");
      signCredentialDeployment.mockResolvedValueOnce("");
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      // WHEN
      const observable = onboardAccount(currency, "test-device", account);

      // THEN
      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow(
        "Failed to obtain signature from device",
      );
    });

    it("should convert TransportStatusError 0x6985 to UserRefusedOnDevice", async () => {
      // GIVEN
      setupSuccessfulMocks();
      const { signCredentialDeployment } = jest.requireMock("../signer");
      const transportError = new TransportStatusError(0x6985);
      signCredentialDeployment.mockRejectedValueOnce(transportError);
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      // WHEN
      const observable = onboardAccount(currency, "test-device", account);

      // THEN
      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow(UserRefusedOnDevice);
    });

    it("should convert TransportStatusError 0x5515 to LockedDeviceError", async () => {
      // GIVEN
      setupSuccessfulMocks();
      const { signCredentialDeployment } = jest.requireMock("../signer");
      const transportError = new TransportStatusError(0x5515);
      signCredentialDeployment.mockRejectedValueOnce(transportError);
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      // WHEN
      const observable = onboardAccount(currency, "test-device", account);

      // THEN
      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow(LockedDeviceError);
    });

    it("should pass through other TransportStatusErrors", async () => {
      // GIVEN
      setupSuccessfulMocks();
      const { signCredentialDeployment } = jest.requireMock("../signer");
      const transportError = new TransportStatusError(0x6a80);
      signCredentialDeployment.mockRejectedValueOnce(transportError);
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      // WHEN
      const observable = onboardAccount(currency, "test-device", account);

      // THEN
      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow(
        TransportStatusError,
      );
    });

    it("should call getPublicKey with correct parameters", async () => {
      // GIVEN
      setupSuccessfulMocks();
      const { getPublicKey } = jest.requireMock("../signer");
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });
      account.freshAddressPath = "m/1105'/0'/1'/2'/3'/4'";

      // WHEN
      const observable = onboardAccount(currency, "test-device", account);
      await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(getPublicKey).toHaveBeenCalledWith(
        signerContext,
        "test-device",
        "m/1105'/0'/1'/2'/3'/4'",
      );
    });

    it("should call submitCredential with currency and credential data", async () => {
      // GIVEN
      setupSuccessfulMocks();
      const { submitCredential } = jest.requireMock("../network/proxyClient");
      const { buildSubmitCredentialData } = jest.requireMock("../network/utils");
      buildSubmitCredentialData.mockReturnValue({ v: 0, value: { test: "data" } });
      const mockSigner = createFixtureSigner();
      const signerContext = createFixtureSignerContext(mockSigner);
      const onboardAccount = buildOnboardAccount(signerContext);
      const currency = createFixtureCurrency();
      const account = createFixtureAccount({ freshAddress: "", xpub: "" });

      // WHEN
      const observable = onboardAccount(currency, "test-device", account);
      await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(submitCredential).toHaveBeenCalledWith(currency, { v: 0, value: { test: "data" } });
    });
  });

  describe("buildPairWalletConnect", () => {
    it("should emit INIT, PREPARE with URI, and SUCCESS with session topic", async () => {
      // GIVEN
      mockInitiatePairing.mockResolvedValue({
        uri: encodeURIComponent("wc:test-uri"),
        approval: jest.fn().mockResolvedValue({ topic: "session-topic-123" }),
      });
      const pairWalletConnect = buildPairWalletConnect();
      const currency = createFixtureCurrency();

      // WHEN
      const observable = pairWalletConnect(currency, "test-device");
      const events = await firstValueFrom(observable.pipe(toArray()));

      // THEN
      const statuses = events.filter(e => "status" in e).map(e => e.status);
      expect(statuses).toContain(ConcordiumPairingStatus.INIT);
      expect(statuses).toContain(ConcordiumPairingStatus.PREPARE);
      expect(statuses).toContain(ConcordiumPairingStatus.SUCCESS);
      const prepareEvent = events.find(e => e.status === ConcordiumPairingStatus.PREPARE);
      expect(prepareEvent?.walletConnectUri).toContain(encodeURIComponent("wc:test-uri"));
      const successEvent = events.find(e => e.status === ConcordiumPairingStatus.SUCCESS);
      expect(successEvent).toMatchObject({
        sessionTopic: "session-topic-123",
      });
    });

    it("should throw error when WalletConnect is not available", async () => {
      // GIVEN
      const { getWalletConnect } = jest.requireMock("../network/walletConnect");
      getWalletConnect.mockReturnValueOnce(null);
      const pairWalletConnect = buildPairWalletConnect();
      const currency = createFixtureCurrency();

      // WHEN
      const observable = pairWalletConnect(currency, "test-device");

      // THEN
      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow(
        "WalletConnect context is not available",
      );
    });

    it("should throw error when initiatePairing returns no URI", async () => {
      // GIVEN
      mockInitiatePairing.mockResolvedValue({
        uri: null,
        approval: jest.fn(),
      });
      const pairWalletConnect = buildPairWalletConnect();
      const currency = createFixtureCurrency();

      // WHEN
      const observable = pairWalletConnect(currency, "test-device");

      // THEN
      await expect(firstValueFrom(observable.pipe(toArray()))).rejects.toThrow(
        "WalletConnect connect() returned no URI",
      );
    });

    it("should emit ERROR status before throwing error", async () => {
      // GIVEN
      const { getWalletConnect } = jest.requireMock("../network/walletConnect");
      getWalletConnect.mockReturnValueOnce(null);
      const pairWalletConnect = buildPairWalletConnect();
      const currency = createFixtureCurrency();

      // WHEN
      const observable = pairWalletConnect(currency, "test-device");
      const events: unknown[] = [];
      await new Promise<void>((resolve, reject) => {
        observable.subscribe({
          next: event => events.push(event),
          error: () => resolve(),
          complete: () => reject(new Error("Should have errored")),
        });
      });

      // THEN
      expect(events).toContainEqual({ status: ConcordiumPairingStatus.INIT });
      expect(events).toContainEqual({ status: ConcordiumPairingStatus.ERROR });
    });

    it("should construct correct walletConnectUri with encoded URI", async () => {
      // GIVEN - initiatePairing returns already-encoded URI
      const originalUri = "wc:abc123@2?relay-protocol=irn&symKey=xyz";
      const encodedUri = encodeURIComponent(originalUri);
      mockInitiatePairing.mockResolvedValue({
        uri: encodedUri,
        approval: jest.fn().mockResolvedValue({ topic: "topic" }),
      });
      const pairWalletConnect = buildPairWalletConnect();
      const currency = createFixtureCurrency();

      // WHEN
      const observable = pairWalletConnect(currency, "test-device");
      const events = await firstValueFrom(observable.pipe(toArray()));

      // THEN
      const prepareEvent = events.find(
        e => (e as { status: string }).status === ConcordiumPairingStatus.PREPARE,
      ) as { walletConnectUri: string };
      expect(prepareEvent.walletConnectUri).toContain("wallet-connect?encodedUri=");

      // Verify the encoded URI is passed through as-is (not double-encoded)
      expect(prepareEvent.walletConnectUri).toContain(`encodedUri=${encodedUri}`);
    });

    it("should call getConcordiumNetwork with currency", async () => {
      // GIVEN
      mockInitiatePairing.mockResolvedValue({
        uri: "wc:test",
        approval: jest.fn().mockResolvedValue({ topic: "topic" }),
      });
      const { getConcordiumNetwork } = jest.requireMock("../network/utils");
      const pairWalletConnect = buildPairWalletConnect();
      const currency = createFixtureCurrency();

      // WHEN
      const observable = pairWalletConnect(currency, "test-device");
      await firstValueFrom(observable.pipe(toArray()));

      // THEN
      expect(getConcordiumNetwork).toHaveBeenCalledWith(currency);
    });
  });
});
