import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { firstValueFrom, toArray } from "rxjs";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { buildOnboardAccount, isCantonCoinPreapproved } from "./onboard";
import * as gateway from "../network/gateway";
import * as signTransactionModule from "../common-logic/transaction/sign";
import { createMockAccount } from "../test/fixtures";
import type { CantonSigner, CantonSignature } from "../types";
import { OnboardStatus, CantonOnboardProgress, CantonOnboardResult } from "../types/onboard";

jest.mock("../network/gateway");
jest.mock("../common-logic/transaction/sign");
const mockedGateway = gateway as jest.Mocked<typeof gateway>;
const mockedSignTransaction = signTransactionModule as jest.Mocked<typeof signTransactionModule>;

describe("onboard", () => {
  const mockPartyId = "test-party-id";
  const mockCurrency = {
    id: "canton_network",
  } as unknown as CryptoCurrency;

  describe("isCantonCoinPreapproved", () => {
    it("should return true when contract exists and is not expired", async () => {
      // GIVEN
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      mockedGateway.getTransferPreApproval.mockResolvedValue({
        contract_id: "test-contract-id",
        receiver: mockPartyId,
        provider: "test-provider",
        valid_from: "2024-01-01T00:00:00Z",
        last_renewed_at: "2024-01-01T00:00:00Z",
        expires_at: futureDate.toISOString(),
      });

      // WHEN
      const result = await isCantonCoinPreapproved(mockCurrency, mockPartyId);

      // THEN
      expect(result).toBe(true);
      expect(mockedGateway.getTransferPreApproval).toHaveBeenCalledWith(mockCurrency, mockPartyId);
    });

    it("should return false when contract exists but is expired", async () => {
      // GIVEN
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      mockedGateway.getTransferPreApproval.mockResolvedValue({
        contract_id: "test-contract-id",
        receiver: mockPartyId,
        provider: "test-provider",
        valid_from: "2024-01-01T00:00:00Z",
        last_renewed_at: "2024-01-01T00:00:00Z",
        expires_at: pastDate.toISOString(),
      });

      // WHEN
      const result = await isCantonCoinPreapproved(mockCurrency, mockPartyId);

      // THEN
      expect(result).toBe(false);
      expect(mockedGateway.getTransferPreApproval).toHaveBeenCalledWith(mockCurrency, mockPartyId);
    });
  });

  describe("buildOnboardAccount", () => {
    const mockDeviceId = "test-device-id";
    const mockPublicKey = "test-public-key";
    const mockPartyId = "test-party-id";
    const mockSignature: CantonSignature = {
      signature: "test-signature",
    };

    const mockSigner: CantonSigner = {
      getAddress: jest.fn().mockResolvedValue({
        address: "test-address",
        publicKey: mockPublicKey,
        path: "44'/6767'/0'/0/0",
      }),
      signTransaction: jest.fn().mockResolvedValue(mockSignature),
    } as unknown as CantonSigner;

    const mockSignerContext: SignerContext<CantonSigner> = jest.fn(
      async (deviceId: string, callback: (signer: CantonSigner) => Promise<CantonSignature>) => {
        return callback(mockSigner);
      },
    ) as unknown as SignerContext<CantonSigner>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should skip submission when account is onboarded on network but has no local xpub", async () => {
      // GIVEN
      const account = createMockAccount({ xpub: undefined });
      mockedGateway.getPartyByPubKey.mockResolvedValue({ party_id: mockPartyId });

      const onboardObservable = buildOnboardAccount(mockSignerContext);
      const values = await firstValueFrom(
        onboardObservable(mockCurrency, mockDeviceId, account).pipe(toArray()),
      );

      // THEN
      const result = values.find((v): v is CantonOnboardResult => "partyId" in v);
      expect(result).toBeDefined();
      expect(result?.partyId).toBe(mockPartyId);
      expect(result?.account.xpub).toBe(mockPartyId);

      // Should NOT call prepareOnboarding or submitOnboarding
      expect(mockedGateway.prepareOnboarding).not.toHaveBeenCalled();
      expect(mockedGateway.submitOnboarding).not.toHaveBeenCalled();
      expect(mockedSignTransaction.signTransaction).not.toHaveBeenCalled();
    });

    it("should proceed with submission when account has xpub (re-onboarding scenario)", async () => {
      // GIVEN - account already has xpub (re-onboarding)
      const existingPartyId = "existing-party-id";
      const account = createMockAccount({ xpub: existingPartyId });
      const newPartyId = "new-party-id";

      mockedGateway.getPartyByPubKey.mockResolvedValue({ party_id: existingPartyId });
      mockedGateway.prepareOnboarding.mockResolvedValue({
        party_id: newPartyId,
        transactions: {},
      });
      mockedGateway.submitOnboarding.mockResolvedValue({
        party: {
          party_id: newPartyId,
          public_key: mockPublicKey,
        },
      });
      mockedSignTransaction.signTransaction.mockResolvedValue(mockSignature);

      const onboardObservable = buildOnboardAccount(mockSignerContext);
      const values = await firstValueFrom(
        onboardObservable(mockCurrency, mockDeviceId, account).pipe(toArray()),
      );

      // THEN - should proceed through full onboarding flow
      const statuses = values
        .filter((v): v is CantonOnboardProgress => "status" in v)
        .map(v => v.status);
      expect(statuses).toContain(OnboardStatus.PREPARE);
      expect(statuses).toContain(OnboardStatus.SIGN);
      expect(statuses).toContain(OnboardStatus.SUBMIT);

      // Should call prepareOnboarding and submitOnboarding
      expect(mockedGateway.prepareOnboarding).toHaveBeenCalledWith(mockCurrency, mockPublicKey);
      expect(mockedGateway.submitOnboarding).toHaveBeenCalled();
      expect(mockedSignTransaction.signTransaction).toHaveBeenCalled();

      // Should clear topology change cache
      expect(mockedGateway.clearIsTopologyChangeRequiredCache).toHaveBeenCalledWith(
        mockCurrency,
        mockPublicKey,
      );

      const result = values.find((v): v is CantonOnboardResult => "partyId" in v);
      expect(result).toBeDefined();
      expect(result?.partyId).toBe(newPartyId);
    });
  });
});
