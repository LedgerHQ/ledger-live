import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { firstValueFrom, toArray } from "rxjs";
import coinConfig from "../config";
import { createMockSigner, generateMockKeyPair } from "../test/cantonTestUtils";
import { createMockAccount, createMockCantonCurrency } from "../test/fixtures";
import {
  AuthorizeStatus,
  CantonAuthorizeProgress,
  CantonAuthorizeResult,
  CantonOnboardProgress,
  CantonOnboardResult,
  OnboardStatus,
} from "../types/onboard";
import { buildAuthorizePreapproval, buildOnboardAccount, isAccountOnboarded } from "./onboard";

describe.skip("onboard (devnet)", () => {
  const mockDeviceId = "test-device-id";
  const mockCurrency = createMockCantonCurrency();
  const mockAccount = createMockAccount();

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
      nativeInstrumentId: "Amulet",
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
      expect(progressValues.some(p => p.status === OnboardStatus.INIT)).toBe(true);
      expect(progressValues.some(p => p.status === OnboardStatus.PREPARE)).toBe(true);
      expect(progressValues.some(p => p.status === OnboardStatus.SIGN)).toBe(true);
      expect(progressValues.some(p => p.status === OnboardStatus.SUBMIT)).toBe(true);

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

  describe("buildAuthorizePreapproval", () => {
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
});
