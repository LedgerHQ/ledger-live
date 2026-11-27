import { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { firstValueFrom, toArray } from "rxjs";
import * as signTransactionModule from "./sign";
import * as gateway from "../network/gateway";
import {
  configOfCall,
  createMockCantonAccount,
  createMockCoinConfigValue,
  createMockContext,
} from "../test/fixtures";
import type { CantonAccount, CantonSigner, CantonSignature } from "../types";
import { CantonInvalidConfigError } from "../types/errors";
import { OnboardStatus, CantonOnboardProgress, CantonOnboardResult } from "../types/onboard";
import { buildOnboardAccount, isAccountOnboarded, isCantonCoinPreapproved } from "./onboard";

jest.mock("../network/gateway");
jest.mock("./sign");
const mockedGateway = gateway as jest.Mocked<typeof gateway>;
const mockedSignTransaction = signTransactionModule as jest.Mocked<typeof signTransactionModule>;

describe("onboard", () => {
  const mockPartyId = "test-party-id";
  const mockCurrency = {
    id: "canton_network",
  } as unknown as CryptoCurrency;
  const mockConfig = createMockCoinConfigValue();
  const mockContext = createMockContext(mockConfig);

  describe("isAccountOnboarded", () => {
    it("reports the party the gateway knows for the key", async () => {
      mockedGateway.getPartyByPubKey.mockResolvedValue({ party_id: "p", public_key: "k" });

      await expect(isAccountOnboarded(mockContext, "k")).resolves.toEqual({
        isOnboarded: true,
        partyId: "p",
      });
    });

    it("reports not onboarded when the lookup fails with a network error", async () => {
      mockedGateway.getPartyByPubKey.mockRejectedValue(new Error("Network error"));

      await expect(isAccountOnboarded(mockContext, "k")).resolves.toEqual({ isOnboarded: false });
    });

    it("rejects when the lookup finds an invalid config", async () => {
      mockedGateway.getPartyByPubKey.mockRejectedValue(
        new CantonInvalidConfigError("canton: coin config gatewayUrl"),
      );

      await expect(isAccountOnboarded(mockContext, "k")).rejects.toThrow(CantonInvalidConfigError);
    });
  });

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
      const result = await isCantonCoinPreapproved(mockContext, mockPartyId);

      // THEN
      expect(result).toBe(true);
      expect(mockedGateway.getTransferPreApproval).toHaveBeenCalledWith(mockContext, mockPartyId);
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
      const result = await isCantonCoinPreapproved(mockContext, mockPartyId);

      // THEN
      expect(result).toBe(false);
      expect(mockedGateway.getTransferPreApproval).toHaveBeenCalledWith(mockContext, mockPartyId);
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
      async (_deviceId: string, callback: (signer: CantonSigner) => Promise<CantonSignature>) => {
        return callback(mockSigner);
      },
    ) as unknown as SignerContext<CantonSigner>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should skip submission when account is onboarded on network but has no local xpub", async () => {
      // GIVEN
      const account = createMockCantonAccount();
      mockedGateway.getPartyByPubKey.mockResolvedValue({
        party_id: mockPartyId,
        public_key: mockPublicKey,
      });

      const onboardObservable = buildOnboardAccount(mockSignerContext, mockContext);
      const values = await firstValueFrom(
        onboardObservable(mockCurrency, mockDeviceId, account).pipe(toArray()),
      );

      // THEN
      const result = values.find((v): v is CantonOnboardResult => "partyId" in v);
      expect(result).toMatchObject({
        partyId: mockPartyId,
        account: expect.objectContaining({
          xpub: mockPartyId,
          cantonResources: expect.objectContaining({ isOnboarded: true }),
        }),
      });

      // Should NOT call prepareOnboarding or submitOnboarding
      expect(mockedGateway.prepareOnboarding).not.toHaveBeenCalled();
      expect(mockedGateway.submitOnboarding).not.toHaveBeenCalled();
      expect(mockedSignTransaction.signTransaction).not.toHaveBeenCalled();
    });

    it("onboards an account that has no cantonResources yet", async () => {
      const { cantonResources: _none, ...account } = createMockCantonAccount();
      mockedGateway.getPartyByPubKey.mockResolvedValue({
        party_id: mockPartyId,
        public_key: mockPublicKey,
      });

      const onboardObservable = buildOnboardAccount(mockSignerContext, mockContext);
      const values = await firstValueFrom(
        onboardObservable(mockCurrency, mockDeviceId, account).pipe(toArray()),
      );

      const result = values.find((v): v is CantonOnboardResult => "partyId" in v);
      expect((result?.account as CantonAccount | undefined)?.cantonResources).toEqual({
        isOnboarded: true,
      });
    });

    it("should proceed with submission when account has xpub (re-onboarding scenario)", async () => {
      // GIVEN - account already has xpub (re-onboarding)
      const existingPartyId = "existing-party-id";
      const account = createMockCantonAccount(
        { xpub: existingPartyId },
        {
          nativeInstrumentAdmin: "DSO::before-reset",
          scanCheckpoint: { hash: "before-reset", height: 12 },
          replayTransactions: [{ hash: "other-party", height: 13 }],
        },
      );
      const newPartyId = "new-party-id";

      mockedGateway.getPartyByPubKey.mockResolvedValue({
        party_id: existingPartyId,
        public_key: mockPublicKey,
      });
      mockedGateway.prepareOnboarding.mockResolvedValue({
        party_id: newPartyId,
        party_name: "test-party-name",
        public_key_fingerprint: "test-fingerprint",
        transactions: {} as any,
        challenge_nonce: "test-nonce",
        challenge_deadline: 1735689599,
      });
      mockedGateway.submitOnboarding.mockResolvedValue({
        party: {
          party_id: newPartyId,
          public_key: mockPublicKey,
        },
      });
      mockedSignTransaction.signTransaction.mockResolvedValue(mockSignature);

      const onboardObservable = buildOnboardAccount(mockSignerContext, mockContext);
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
      expect(mockedGateway.prepareOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({ logger: mockContext.logger }),
        mockPublicKey,
      );
      await expect(configOfCall(mockedGateway.prepareOnboarding.mock.calls[0])).resolves.toBe(
        mockConfig,
      );
      expect(mockedGateway.submitOnboarding).toHaveBeenCalled();
      expect(mockedSignTransaction.signTransaction).toHaveBeenCalled();

      // Should clear topology change cache
      expect(mockedGateway.clearIsTopologyChangeRequiredCache).toHaveBeenCalledWith(
        expect.objectContaining({ logger: mockContext.logger }),
        mockPublicKey,
      );

      const result = values.find((v): v is CantonOnboardResult => "partyId" in v);
      expect(result).toMatchObject({
        partyId: newPartyId,
        account: expect.objectContaining({
          xpub: newPartyId,
          cantonResources: expect.objectContaining({ isOnboarded: true }),
        }),
      });
      // A reset replaces the DSO party, so sync must not use the one saved or cached before it.
      expect(mockedGateway.clearDsoPartyIdCache).toHaveBeenCalledWith(
        expect.objectContaining({ logger: mockContext.logger }),
      );
      expect((result?.account as CantonAccount | undefined)?.cantonResources).not.toHaveProperty(
        "nativeInstrumentAdmin",
      );
      expect((result?.account as CantonAccount | undefined)?.cantonResources).not.toHaveProperty(
        "scanCheckpoint",
      );
      expect((result?.account as CantonAccount | undefined)?.cantonResources).not.toHaveProperty(
        "replayTransactions",
      );
    });

    it("links the existing party (no submit) when prepareOnboarding reports it already exists", async () => {
      // Re-adding a just-onboarded account during the gateway's by-public-key index lag:
      // getPartyByPubKey still 404s, but prepareOnboarding reports the party already exists (with its id).
      const account = createMockCantonAccount();
      const existingPartyId =
        "ldg::1220ac1d0368a250bc2b515a058d04a8b884cae4bb425258270ab3019b1ddd49cd1f";

      mockedGateway.getPartyByPubKey.mockRejectedValue(
        new Error('Party with public key "pk" does not exist'),
      );
      mockedGateway.prepareOnboarding.mockRejectedValue(
        new Error(
          `Party with id "${existingPartyId}" already exists and its topology is up to date`,
        ),
      );
      mockedGateway.isPartyAlreadyExists.mockReturnValue(true);

      const onboardObservable = buildOnboardAccount(mockSignerContext, mockContext);
      const values = await firstValueFrom(
        onboardObservable(mockCurrency, mockDeviceId, account).pipe(toArray()),
      );

      // Linked the existing party directly — no submission, no signing.
      expect(mockedGateway.submitOnboarding).not.toHaveBeenCalled();
      expect(mockedSignTransaction.signTransaction).not.toHaveBeenCalled();

      const result = values.find((v): v is CantonOnboardResult => "partyId" in v);
      expect(result).toMatchObject({
        partyId: existingPartyId,
        account: expect.objectContaining({
          xpub: existingPartyId,
          cantonResources: expect.objectContaining({ isOnboarded: true }),
        }),
      });
    });

    it.each([
      ["the account", { xpub: "same-party" }, {}],
      ["the Canton resources only", {}, { xpub: "same-party" }],
    ])(
      "keeps the transactions to read again of the same party, known from %s",
      async (_, overrides, resources) => {
        const replayTransactions = [{ hash: "offer", height: 13 }];
        const account = createMockCantonAccount(overrides, { ...resources, replayTransactions });
        mockedGateway.getPartyByPubKey.mockRejectedValue(new Error("not found"));
        mockedGateway.prepareOnboarding.mockRejectedValue(
          new Error('Party with id "same-party" already exists and its topology is up to date'),
        );
        mockedGateway.isPartyAlreadyExists.mockReturnValue(true);

        const values = await firstValueFrom(
          buildOnboardAccount(mockSignerContext, mockContext)(
            mockCurrency,
            mockDeviceId,
            account,
          ).pipe(toArray()),
        );

        const result = values.find((v): v is CantonOnboardResult => "partyId" in v);
        expect((result?.account as CantonAccount | undefined)?.cantonResources).toMatchObject({
          replayTransactions,
        });
      },
    );
  });
});
