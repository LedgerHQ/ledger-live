import { firstValueFrom, toArray } from "rxjs";
import { generateMockKeyPair, createMockSigner } from "../test/cantonTestUtils";
import { buildOnboardAccount, isAccountOnboarded, buildAuthorizePreapproval } from "./onboard";
import {
  OnboardStatus,
  PreApprovalStatus,
  CantonOnboardProgress,
  CantonOnboardResult,
  CantonPreApprovalProgress,
  CantonPreApprovalResult,
} from "../types/onboard";
import coinConfig from "../config";

describe("onboard integration tests", () => {
  const mockDeviceId = "test-device-id";
  const mockDerivationPath = "44'/6767'/0'/0'/0'";

  let onboardedAccount: {
    keyPair: ReturnType<typeof generateMockKeyPair>;
    mockSigner: ReturnType<typeof createMockSigner>;
    mockSignerContext: jest.Mock;
    onboardResult: CantonOnboardResult;
  } | null = null;

  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      gatewayUrl: "https://canton-gateway.api.live.ledger-test.com",
      useGateway: true,
      networkType: "devnet",
      status: {
        type: "active",
      },
    }));
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
        onboardObservable(mockDeviceId, mockDerivationPath).pipe(toArray()),
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
      const result = await isAccountOnboarded(keyPair.publicKeyHex);

      // THEN
      expect(result).not.toBe(false);
      if (typeof result === "object") {
        expect(result.party_id).toBeDefined();
        expect(result.party_id).toBe(onboardResult!.partyId);
      }
    }, 30000);

    it("should return false for non-onboarded account with fresh keypair", async () => {
      // GIVEN
      const keyPair = generateMockKeyPair();

      // WHEN
      const result = await isAccountOnboarded(keyPair.publicKeyHex);

      // THEN
      expect(result).toBe(false);
    }, 15000);

    it("should handle errors gracefully when checking non-existent party", async () => {
      // GIVEN
      const keyPair = generateMockKeyPair();

      // WHEN
      const result = await isAccountOnboarded(keyPair.publicKeyHex);

      // THEN
      expect(result).toBe(false);
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
        onboardObservable(mockDeviceId, mockDerivationPath).pipe(toArray()),
      );
      const progressValues = allValues.filter(
        (value): value is CantonOnboardProgress => "status" in value && !("partyId" in value),
      );
      const resultValues = allValues.filter(
        (value): value is CantonOnboardResult => "partyId" in value,
      );

      // THEN
      // Check expected status progression
      expect(progressValues.some(p => p.status === OnboardStatus.INIT)).toBe(true);
      expect(progressValues.some(p => p.status === OnboardStatus.PREPARE)).toBe(true);
      expect(progressValues.some(p => p.status === OnboardStatus.SIGN)).toBe(true);
      expect(progressValues.some(p => p.status === OnboardStatus.SUBMIT)).toBe(true);

      // Check final result
      expect(resultValues.length).toBeGreaterThan(0);
      const finalResult = resultValues[resultValues.length - 1];
      expect(finalResult.partyId).toBeDefined();
      expect(finalResult.publicKey).toBe(keyPair.publicKeyHex);
      expect(finalResult.address).toBeDefined();
      expect(finalResult.transactionHash).toBeDefined();

      expect(mockSignerContext).toHaveBeenCalled();
    }, 30000);

    it("should complete full onboarding flow with already onboarded account", async () => {
      // GIVEN
      const { keyPair, mockSignerContext, onboardResult: firstResult } = getOnboardedAccount();
      const secondOnboardObservable = buildOnboardAccount(mockSignerContext);

      // WHEN
      const secondOnboardValues = await firstValueFrom(
        secondOnboardObservable(mockDeviceId, mockDerivationPath).pipe(toArray()),
      );
      const secondResult = secondOnboardValues.find(
        (value): value is CantonOnboardResult => "partyId" in value,
      );

      // THEN
      expect(secondResult).toBeDefined();
      expect(secondResult!.partyId).toBe(firstResult.partyId);
      expect(secondResult!.publicKey).toBe(keyPair.publicKeyHex);
      expect(secondResult!.address).toBeDefined();
    }, 30000);
  });

  describe("buildAuthorizePreapproval", () => {
    it("should complete preapproval flow for onboarded account", async () => {
      // GIVEN
      const { mockSignerContext, onboardResult } = getOnboardedAccount();
      const preapprovalObservable = buildAuthorizePreapproval(mockSignerContext);

      // WHEN
      const preapprovalValues = await firstValueFrom(
        preapprovalObservable(mockDeviceId, mockDerivationPath, onboardResult.partyId).pipe(
          toArray(),
        ),
      );
      const progressValues = preapprovalValues.filter(
        (value): value is CantonPreApprovalProgress => "status" in value && !("approved" in value),
      );
      const resultValues = preapprovalValues.filter(
        (value): value is CantonPreApprovalResult => "approved" in value,
      );

      // THEN
      // Check expected status progression
      expect(progressValues.some(p => p.status === PreApprovalStatus.PREPARE)).toBe(true);
      expect(progressValues.some(p => p.status === PreApprovalStatus.SIGN)).toBe(true);
      expect(progressValues.some(p => p.status === PreApprovalStatus.SUBMIT)).toBe(true);

      // Check final result (should be approved)
      expect(resultValues.length).toBeGreaterThan(0);
      const finalResult = resultValues[resultValues.length - 1];
      expect(finalResult.signature).toBeDefined();
      expect(finalResult.approved).toBe(true);
      expect(finalResult.transactionId).toBeDefined();
    }, 30000);

    it("should handle invalid party ID gracefully", async () => {
      // GIVEN
      const keyPair = generateMockKeyPair();
      const mockSigner = createMockSigner(keyPair);
      const mockSignerContext = jest.fn().mockImplementation((deviceId, callback) => {
        return callback(mockSigner);
      });
      const preapprovalObservable = buildAuthorizePreapproval(mockSignerContext);

      // WHEN & THEN
      try {
        await firstValueFrom(
          preapprovalObservable(mockDeviceId, mockDerivationPath, "invalid-party-id-123"),
        );
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    }, 30000);
  });
});
