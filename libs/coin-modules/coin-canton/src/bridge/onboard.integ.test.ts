import { firstValueFrom, toArray } from "rxjs";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { createMockSigner, generateMockKeyPair } from "../test/cantonTestUtils";
import {
  createMockCantonAccount,
  createMockCantonCurrency,
  setupMockCoinConfig,
} from "../test/fixtures";
import {
  AuthorizeStatus,
  CantonAuthorizeProgress,
  CantonAuthorizeResult,
  CantonOnboardProgress,
  CantonOnboardResult,
  AccountOnboardStatus,
} from "../types/onboard";
import { buildAuthorizePreapproval, buildOnboardAccount, isAccountOnboarded } from "./onboard";
import {
  isTopologyChangeRequiredCached,
  clearIsTopologyChangeRequiredCache,
} from "../network/gateway";

describe("onboard (devnet)", () => {
  const mockAccount = createMockCantonAccount();
  const mockCurrency = createMockCantonCurrency();
  const mockDeviceId = "test-device-id";

  let onboardedAccount: {
    keyPair: ReturnType<typeof generateMockKeyPair>;
    mockSigner: ReturnType<typeof createMockSigner>;
    mockSignerContext: jest.Mock;
    onboardResult: CantonOnboardResult;
  } | null = null;

  beforeAll(() => {
    setupMockCoinConfig();
  });

  const getOnboardedAccount = () => {
    if (!onboardedAccount) {
      throw new Error(
        "onboardedAccount is null. Ensure isAccountOnboarded test runs first to set it.",
      );
    }
    return onboardedAccount;
  };

  describe("isAccountOnboarded", () => {
    it("should return true for onboarded account", async () => {
      // GIVEN
      const keyPair = generateMockKeyPair();
      const mockSigner = createMockSigner(keyPair);
      const mockSignerContext = jest.fn().mockImplementation((deviceId, callback) => {
        return callback(mockSigner);
      });

      const onboardObservable = buildOnboardAccount(mockSignerContext);
      const onboardValues = await firstValueFrom(
        onboardObservable(mockCurrency, mockDeviceId, mockAccount).pipe(toArray()),
      );
      const onboardResult = onboardValues.find(
        (value): value is CantonOnboardResult => "partyId" in value,
      );

      if (!onboardResult) {
        throw new Error("Failed to onboard account for shared test data");
      }

      // Save onboarded account for all tests that need a valid party ID
      onboardedAccount = {
        keyPair,
        mockSigner,
        mockSignerContext,
        onboardResult,
      };

      // WHEN
      const result = await isAccountOnboarded(mockCurrency, keyPair.publicKeyHex);

      // THEN
      expect(result).not.toBe(false);
      if (typeof result === "object") {
        expect(result.partyId).toBeDefined();
        expect(result.partyId).toBe(onboardResult.partyId);
      }
    }, 40000);

    it("should return false for non-onboarded account with fresh keypair", async () => {
      // GIVEN
      const keyPair = generateMockKeyPair();

      // WHEN
      const result = await isAccountOnboarded(mockCurrency, keyPair.publicKeyHex);

      // THEN
      expect(result).toEqual({ isOnboarded: false });
    }, 15000);

    it("should handle errors gracefully when checking non-existent party", async () => {
      // GIVEN
      const keyPair = generateMockKeyPair();

      // WHEN
      const result = await isAccountOnboarded(mockCurrency, keyPair.publicKeyHex);

      // THEN
      expect(result).toEqual({ isOnboarded: false });
    }, 15000);
  });

  describe("buildOnboardAccount", () => {
    it("should complete full onboarding flow with fresh keypair", async () => {
      // GIVEN
      const keyPair = generateMockKeyPair();
      const mockSigner = createMockSigner(keyPair);
      const mockSignerContext = jest.fn().mockImplementation((deviceId, callback) => {
        return callback(mockSigner);
      });
      const onboardObservable = buildOnboardAccount(mockSignerContext);

      // WHEN
      const allValues = await firstValueFrom(
        onboardObservable(mockCurrency, mockDeviceId, mockAccount).pipe(toArray()),
      );
      const progressValues = allValues.filter(
        (value): value is CantonOnboardProgress => "status" in value && !("partyId" in value),
      );
      const resultValues = allValues.filter(
        (value): value is CantonOnboardResult => "partyId" in value,
      );

      // THEN
      // Check expected status progression
      expect(progressValues.some(p => p.status === AccountOnboardStatus.INIT)).toBe(true);
      expect(progressValues.some(p => p.status === AccountOnboardStatus.PREPARE)).toBe(true);
      expect(progressValues.some(p => p.status === AccountOnboardStatus.SIGN)).toBe(true);
      expect(progressValues.some(p => p.status === AccountOnboardStatus.SUBMIT)).toBe(true);

      // Check final result
      expect(resultValues.length).toBeGreaterThan(0);
      const finalResult = resultValues[resultValues.length - 1];
      expect(finalResult.partyId).toBeDefined();
      expect(typeof finalResult.partyId).toBe("string");

      expect(mockSignerContext).toHaveBeenCalled();
    }, 30000);

    it("should complete full onboarding flow with already onboarded account", async () => {
      // GIVEN
      const { mockSignerContext, onboardResult: firstResult } = getOnboardedAccount();
      const secondOnboardObservable = buildOnboardAccount(mockSignerContext);

      // WHEN
      const secondOnboardValues = await firstValueFrom(
        secondOnboardObservable(mockCurrency, mockDeviceId, mockAccount).pipe(toArray()),
      );
      const secondResult = secondOnboardValues.find(
        (value): value is CantonOnboardResult => "partyId" in value,
      );

      // THEN
      expect(secondResult).toBeDefined();
      expect(secondResult!.partyId).toBe(firstResult.partyId);
      expect(typeof secondResult!.partyId).toBe("string");
    }, 30000);
  });

  describe.skip("buildAuthorizePreapproval", () => {
    it("should complete preapproval flow for onboarded account", async () => {
      // GIVEN
      const { mockSignerContext, onboardResult } = getOnboardedAccount();
      const preapprovalObservable = buildAuthorizePreapproval(mockSignerContext);

      // WHEN
      const preapprovalValues = await firstValueFrom(
        preapprovalObservable(mockCurrency, mockDeviceId, mockAccount, onboardResult.partyId).pipe(
          toArray(),
        ),
      );

      const progressValues = preapprovalValues.filter(
        (value): value is CantonAuthorizeProgress => "status" in value && !("isApproved" in value),
      );
      const resultValues = preapprovalValues.filter(
        (value): value is CantonAuthorizeResult => "isApproved" in value,
      );

      // THEN
      // Check expected status progression
      expect(progressValues.some(p => p.status === AuthorizeStatus.PREPARE)).toBe(true);
      expect(progressValues.some(p => p.status === AuthorizeStatus.SIGN)).toBe(true);
      expect(progressValues.some(p => p.status === AuthorizeStatus.SUBMIT)).toBe(true);

      // Check final result (should be approved)
      expect(resultValues.length).toBeGreaterThan(0);
      const finalResult = resultValues[resultValues.length - 1];
      expect(finalResult.isApproved).toBe(true);
      expect(typeof finalResult.isApproved).toBe("boolean");
    }, 30000);
  });

  describe("TopologyChangeError", () => {
    it("should require topology change and complete re-onboarding when accessing account from different node", async () => {
      // GIVEN
      const originalNodeId = getEnv("CANTON_NODE_ID_OVERRIDE");
      setEnv("CANTON_NODE_ID_OVERRIDE", "devnet");
      const keyPair = generateMockKeyPair();
      const mockAccount = createMockCantonAccount({ xpub: keyPair.publicKeyHex });
      const mockSigner = createMockSigner(keyPair);
      const mockSignerContext = jest.fn().mockImplementation((_, callback) => {
        return callback(mockSigner);
      });

      const onboardObservable = buildOnboardAccount(mockSignerContext);
      const onboardValues = await firstValueFrom(
        onboardObservable(mockCurrency, mockDeviceId, mockAccount).pipe(toArray()),
      );
      const onboardResult = onboardValues.find(
        (value): value is CantonOnboardResult => "partyId" in value,
      );

      if (!onboardResult) {
        throw new Error("Failed to onboard account");
      }

      const partyId = onboardResult.partyId;
      expect(partyId).toBeDefined();

      // Verify account is accessible on devnet node
      const isTopologyChangeRequiredOnDevnet = await isTopologyChangeRequiredCached(
        mockCurrency,
        keyPair.publicKeyHex,
      );
      expect(isTopologyChangeRequiredOnDevnet).toBe(false);

      // WHEN: Switch to different node
      setEnv("CANTON_NODE_ID_OVERRIDE", "devnet-replicated");
      clearIsTopologyChangeRequiredCache(mockCurrency, keyPair.publicKeyHex);

      // THEN: Verify topology change is required
      const isTopologyChangeRequiredOnReplicated = await isTopologyChangeRequiredCached(
        mockCurrency,
        keyPair.publicKeyHex,
      );
      expect(isTopologyChangeRequiredOnReplicated).toBe(true);

      // AND: Verify re-onboarding proceeds through full onboarding flow
      const reonboardObservable = buildOnboardAccount(mockSignerContext);
      const reonboardValues = await firstValueFrom(
        reonboardObservable(mockCurrency, mockDeviceId, mockAccount).pipe(toArray()),
      );
      const progressValues = reonboardValues.filter(
        (value): value is CantonOnboardProgress => "status" in value && !("partyId" in value),
      );
      const resultValues = reonboardValues.filter(
        (value): value is CantonOnboardResult => "partyId" in value,
      );

      // Check expected status progression
      expect(progressValues.some(p => p.status === AccountOnboardStatus.INIT)).toBe(true);
      expect(progressValues.some(p => p.status === AccountOnboardStatus.PREPARE)).toBe(true);
      expect(progressValues.some(p => p.status === AccountOnboardStatus.SIGN)).toBe(true);
      expect(progressValues.some(p => p.status === AccountOnboardStatus.SUBMIT)).toBe(true);

      // Check final result
      expect(resultValues.length).toBeGreaterThan(0);
      const finalResult = resultValues[resultValues.length - 1];
      expect(finalResult.partyId).toBeDefined();
      expect(typeof finalResult.partyId).toBe("string");

      if (originalNodeId) {
        setEnv("CANTON_NODE_ID_OVERRIDE", originalNodeId);
      } else {
        setEnv("CANTON_NODE_ID_OVERRIDE", "");
      }
    }, 60000);
  });
});
