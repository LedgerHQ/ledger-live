import coinConfig from "../config";
import { generateMockKeyPair } from "../test/cantonTestUtils";
import {
  getLedgerEnd,
  prepareOnboarding,
  getBalance,
  getOperations,
  getPartyById,
  getPartyByPubKey,
  submitOnboarding,
  prepareTapRequest,
  submitTapRequest,
  preparePreApprovalTransaction,
  submitPreApprovalTransaction,
} from "./gateway";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const mockCurrency = {
  id: "canton_network",
} as unknown as CryptoCurrency;

describe("gateway (devnet)", () => {
  let onboardedAccount: {
    keyPair: ReturnType<typeof generateMockKeyPair>;
    partyId: string;
  } | null = null;

  beforeAll(async () => {
    coinConfig.setCoinConfig(() => ({
      gatewayUrl: "https://canton-gateway.api.live.ledger-test.com",
      useGateway: true,
      networkType: "devnet",
      status: {
        type: "active",
      },
    }));
  }, 60000);

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
      const response = await prepareOnboarding(mockCurrency, keyPair.publicKeyHex, "ed25519");

      // THEN
      expect(response).toHaveProperty("party_id");
      expect(response).toHaveProperty("party_name");
      expect(response).toHaveProperty("public_key_fingerprint");
      expect(response).toHaveProperty("transactions");
      expect(response.transactions).toHaveProperty("combined_hash");
      expect(response.party_name).toBeDefined();
      expect(typeof response.party_name).toBe("string");

      expect(response.public_key_fingerprint).toBe(keyPair.fingerprint);
    }, 30000);
  });

  describe("submitOnboarding", () => {
    it("should submit onboarding with proper signature", async () => {
      // GIVEN
      const { keyPair } = getOnboardedAccount();
      const prepareRequest = { public_key: keyPair.publicKeyHex, public_key_type: "ed25519" };
      const prepareResponse = await prepareOnboarding(
        mockCurrency,
        keyPair.publicKeyHex,
        "ed25519",
      );
      const signature = keyPair.sign(prepareResponse.transactions.combined_hash);

      // WHEN
      const response = await submitOnboarding(
        mockCurrency,
        prepareRequest,
        prepareResponse,
        signature,
      );

      // Save onboarded account for all tests that need a valid party ID
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
    it.skip("should return party info", async () => {
      const party = await getPartyById(mockCurrency, "4f2e1485107adf5f");
      expect(party).toBeDefined();
    });
  });

  describe("getPartyByPubKey", () => {
    it.skip("should return party info", async () => {
      const party = await getPartyByPubKey(
        mockCurrency,
        "122027c6dbbbdbffe0fa3122ae05175f3b9328e879e9ce96b670354deb64a45683c1",
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
    it("should prepare tap request for onboarded party", async () => {
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
    }, 30000);
  });

  describe("submitTapRequest", () => {
    it("should submit tap request with proper signature", async () => {
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
    }, 30000);
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
    }, 30000);
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
    }, 30000);
  });
});
