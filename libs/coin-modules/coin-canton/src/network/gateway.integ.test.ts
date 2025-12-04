import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import coinConfig from "../config";
import { generateMockKeyPair } from "../test/cantonTestUtils";
import type { OnboardingPrepareResponse } from "../types/gateway";
import {
  getBalance,
  getLedgerEnd,
  getOperations,
  getPartyById,
  getPartyByPubKey,
  prepareOnboarding,
  preparePreApprovalTransaction,
  prepareTapRequest,
  submitOnboarding,
  submitPreApprovalTransaction,
  submitTapRequest,
} from "./gateway";

const mockCurrency = {
  id: "canton_network",
} as unknown as CryptoCurrency;

describe("gateway (devnet)", () => {
  let onboardedAccount: {
    keyPair: ReturnType<typeof generateMockKeyPair>;
    partyId: string;
  } | null = null;

  let prepareResponse: OnboardingPrepareResponse | null = null;

  beforeAll(async () => {
    coinConfig.setCoinConfig(() => ({
      gatewayUrl: "https://canton-gateway.api.live.ledger-test.com",
      useGateway: true,
      nativeInstrumentId: "Amulet",
      networkType: "devnet",
      status: {
        type: "active",
      },
    }));
  });

  const getOnboardedAccount = () => {
    if (!onboardedAccount) {
      throw new Error("Shared onboarded account not available. Check beforeAll setup.");
    }
    return onboardedAccount;
  };

  describe("prepareOnboarding", () => {
    it("should prepare onboarding", async () => {
      // GIVEN
      const keyPair = generateMockKeyPair();

      // Save onboarded account for all tests that need a valid party ID
      onboardedAccount = {
        keyPair,
        partyId: "", // set in next test
      };

      // WHEN
      const response = await prepareOnboarding(mockCurrency, keyPair.publicKeyHex);

      // THEN
      expect(response).toHaveProperty("party_id");
      expect(response).toHaveProperty("party_name");
      expect(response).toHaveProperty("public_key_fingerprint");
      expect(response).toHaveProperty("transactions");
      expect(response.transactions).toHaveProperty("combined_hash");
      expect(response.party_name).toBeDefined();
      expect(typeof response.party_name).toBe("string");

      expect(response.public_key_fingerprint).toBe(keyPair.fingerprint);
    });
  });

  describe("submitOnboarding", () => {
    it("should submit onboarding with proper signature", async () => {
      // GIVEN
      const { keyPair } = getOnboardedAccount();
      // Save prepare response for next test
      prepareResponse = await prepareOnboarding(mockCurrency, keyPair.publicKeyHex);
      const signature = keyPair.sign(prepareResponse.transactions.combined_hash);

      // WHEN
      const response = await submitOnboarding(mockCurrency, keyPair.publicKeyHex, prepareResponse, {
        signature,
      });

      // Save onboarded account for next tests that need a valid party ID
      onboardedAccount = {
        keyPair,
        partyId: response.party.party_id,
      };

      // THEN
      expect(response).toHaveProperty("party");
      expect(response.party).toHaveProperty("party_id");
      expect(response.party).toHaveProperty("public_key");
      expect(response.party.public_key).toBe(keyPair.publicKeyHex);
    }, 30000);

    const testIfPrepared = prepareResponse ? it.skip : it;
    testIfPrepared(
      "should not throw when already onboarded",
      async () => {
        // Add delay to ensure previous operations are complete
        await new Promise(resolve => setTimeout(resolve, 10000));
        // GIVEN
        const { keyPair } = getOnboardedAccount();
        const signature = keyPair.sign(prepareResponse!.transactions.combined_hash);

        // WHEN
        const response = await submitOnboarding(
          mockCurrency,
          keyPair.publicKeyHex,
          prepareResponse!,
          { signature },
        );

        // THEN
        expect(response).toHaveProperty("party");
        expect(response.party).toHaveProperty("party_id");
        expect(response.party).toHaveProperty("public_key");
        expect(response.party.public_key).toBe(keyPair.publicKeyHex);
      },
      30000,
    );

    it("should handle PARTY_ALREADY_EXISTS error and return party_id and public_key", async () => {
      // GIVEN
      const { keyPair, partyId } = getOnboardedAccount();
      const signature = keyPair.sign(prepareResponse?.transactions?.combined_hash || "");

      // WHEN
      const response = await submitOnboarding(
        mockCurrency,
        keyPair.publicKeyHex,
        prepareResponse!,
        {
          signature,
        },
      );

      // THEN
      expect(response).toHaveProperty("party");
      expect(response.party).toHaveProperty("party_id");
      expect(response.party).toHaveProperty("public_key");
      expect(response.party.party_id).toBe(partyId);
      expect(response.party.public_key).toBe(keyPair.publicKeyHex);
    }, 30000);
  });

  describe("getLedgerEnd", () => {
    it("should return ledger end", async () => {
      const end = await getLedgerEnd(mockCurrency);
      expect(end).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getBalance", () => {
    it("should return user balance", async () => {
      const { partyId } = getOnboardedAccount();
      const balance = await getBalance(mockCurrency, partyId);
      expect(balance.length).toBeGreaterThanOrEqual(0);
      if (balance.length > 0) {
        expect(balance[0].amount).toBeGreaterThanOrEqual(0);
        expect(balance[0]).toHaveProperty("instrument_id");
      }
    });
  });

  describe("getPartyById", () => {
    it("should return party info", async () => {
      const party = await getPartyById(
        mockCurrency,
        "ldg::12208b12fa34be8a079bcbb68bba828e58313046c4208855b39885fab48661322e68",
      );
      expect(party).toBeDefined();
    });
  });

  describe("getPartyByPubKey", () => {
    it("should return party info", async () => {
      const party = await getPartyByPubKey(
        mockCurrency,
        "c5cdb19624833f9a929a0125978c886ec4297320c14cea6bf667dc1d23a8e650",
      );
      expect(party).toBeDefined();
    });
  });

  describe("getOperations", () => {
    it("should return user transactions", async () => {
      const { operations } = await getOperations(
        mockCurrency,
        "party-5f29bb32e9939939::12202becd8062a1d170209956cfd977fca76fcb4d2a892d08c77a7483f35a11d6440",
        {},
      );
      expect(operations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("prepareTapRequest", () => {
    it.skip("should prepare tap request for onboarded party", async () => {
      // GIVEN
      const { partyId } = getOnboardedAccount();
      const amount = 1000;

      // WHEN
      const response = await prepareTapRequest(mockCurrency, { partyId, amount });

      // THEN
      expect(response).toHaveProperty("serialized");
      expect(response).toHaveProperty("hash");
      expect(typeof response.serialized).toBe("string");
      expect(typeof response.hash).toBe("string");
    });
  });

  describe("submitTapRequest", () => {
    it.skip("should submit tap request with proper signature", async () => {
      // GIVEN
      const { keyPair, partyId } = getOnboardedAccount();
      const tapPrepareResponse = await prepareTapRequest(mockCurrency, {
        partyId,
        amount: 1000,
      });
      const tapSignature = keyPair.sign(tapPrepareResponse.hash);

      // WHEN
      const response = await submitTapRequest(mockCurrency, {
        partyId,
        serialized: tapPrepareResponse.serialized,
        signature: tapSignature,
      });

      // THEN
      expect(response).toHaveProperty("submission_id");
      expect(response).toHaveProperty("update_id");
      expect(typeof response.submission_id).toBe("string");
      expect(typeof response.update_id).toBe("string");
    });
  });

  describe("preparePreApprovalTransaction", () => {
    it("should prepare pre-approval transaction for onboarded party", async () => {
      // GIVEN
      const { partyId } = getOnboardedAccount();

      // WHEN
      const response = await preparePreApprovalTransaction(mockCurrency, partyId);

      // THEN
      expect(response).toHaveProperty("serialized");
      expect(response).toHaveProperty("hash");
      expect(typeof response.serialized).toBe("string");
      expect(typeof response.hash).toBe("string");
    });
  });

  describe("submitPreApprovalTransaction", () => {
    it("should submit pre-approval transaction with proper signature", async () => {
      // GIVEN
      const { keyPair, partyId } = getOnboardedAccount();
      const preparedTransaction = await preparePreApprovalTransaction(mockCurrency, partyId);
      const preApprovalSignature = keyPair.sign(preparedTransaction.hash);

      // WHEN
      const response = await submitPreApprovalTransaction(
        mockCurrency,
        partyId,
        preparedTransaction,
        preApprovalSignature,
      );

      // THEN
      expect(response).toHaveProperty("isApproved");
      expect(response).toHaveProperty("submissionId");
      expect(response).toHaveProperty("updateId");
      expect(response.isApproved).toBe(true);
      expect(typeof response.submissionId).toBe("string");
      expect(typeof response.updateId).toBe("string");
    });
  });
});
