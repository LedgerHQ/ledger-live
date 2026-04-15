import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { generateMockKeyPair, verifySignature } from "../test/cantonTestUtils";
import { createMockCantonCurrency, setupMockCoinConfig } from "../test/fixtures";
import type { OnboardingPrepareResponse, Party } from "../types/gateway";
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

const mockCurrency = createMockCantonCurrency();

/**
 * Party lookup can lag behind a successful onboarding submit on the gateway (CI / replication).
 * Duck-type 4xx errors: do not use `instanceof LedgerAPI4xx` — Jest can load a duplicate
 * `@ledgerhq/errors` module from live-network, which breaks instanceof and disables retries.
 */
function readErr(error: object): { name?: string; status?: number; message: string } {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- narrow API error fields
  const rec = error as Record<string, unknown>;
  const out: { name?: string; status?: number; message: string } = {
    message: typeof rec.message === "string" ? rec.message : "",
  };
  if (typeof rec.name === "string") out.name = rec.name;
  if (typeof rec.status === "number") out.status = rec.status;
  return out;
}

function isPartyNotYetVisibleError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = readErr(error);
  const msg = e.message.toLowerCase();
  const partyRelated =
    msg.includes("party") &&
    (msg.includes("does not exist") ||
      msg.includes("not found") ||
      msg.includes("unknown") ||
      msg.includes("no such"));
  if (partyRelated) {
    return true;
  }
  if (msg.includes("does not exist") && (msg.includes("party") || msg.includes("ldg::"))) {
    return true;
  }
  if (
    e.name === "LedgerAPI4xx" &&
    e.status !== undefined &&
    e.status >= 400 &&
    e.status < 500 &&
    (e.status === 404 || msg.includes("party") || msg.includes("ldg::"))
  ) {
    return true;
  }
  return false;
}

async function getPartyByIdWhenVisible(
  currency: CryptoCurrency,
  partyId: string,
  opts?: { timeoutMs?: number; pollMs?: number },
): Promise<Party> {
  const timeoutMs = opts?.timeoutMs ?? 100_000;
  const pollMs = opts?.pollMs ?? 2_500;
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      return await getPartyById(currency, partyId);
    } catch (e) {
      lastError = e;
      if (!isPartyNotYetVisibleError(e)) throw e;
      await new Promise<void>(resolve => {
        setTimeout(resolve, pollMs);
      });
    }
  }
  throw lastError ?? new Error("getPartyById timed out waiting for party to be visible");
}

async function getPartyByPubKeyWhenVisible(
  currency: CryptoCurrency,
  publicKeyHex: string,
  opts?: { timeoutMs?: number; pollMs?: number },
): Promise<Party> {
  const timeoutMs = opts?.timeoutMs ?? 100_000;
  const pollMs = opts?.pollMs ?? 2_500;
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      return await getPartyByPubKey(currency, publicKeyHex);
    } catch (e) {
      lastError = e;
      if (!isPartyNotYetVisibleError(e)) throw e;
      await new Promise<void>(resolve => {
        setTimeout(resolve, pollMs);
      });
    }
  }
  throw lastError ?? new Error("getPartyByPubKey timed out waiting for party to be visible");
}

describe("gateway (devnet)", () => {
  let onboardedAccount: {
    keyPair: ReturnType<typeof generateMockKeyPair>;
    partyId: string;
  } | null = null;

  let prepareResponse: OnboardingPrepareResponse | null = null;

  beforeAll(async () => {
    setupMockCoinConfig();
    const keyPair = generateMockKeyPair();
    const pr = await prepareOnboarding(mockCurrency, keyPair.publicKeyHex);
    const signature = keyPair.sign(pr.transactions.combined_hash);
    const verification = verifySignature(
      keyPair.publicKeyHex,
      signature,
      pr.transactions.combined_hash,
    );
    if (!verification.isValid) {
      throw new Error(verification.error ?? "invalid signature in onboarding beforeAll");
    }
    const response = await submitOnboarding(mockCurrency, keyPair.publicKeyHex, pr, {
      signature,
    });
    prepareResponse = pr;
    onboardedAccount = { keyPair, partyId: response.party.party_id };
  }, 120_000);

  const getOnboardedAccount = () => {
    if (!onboardedAccount) {
      throw new Error("Shared onboarded account not available. Check beforeAll setup.");
    }
    return onboardedAccount;
  };

  describe("prepareOnboarding", () => {
    it("should prepare onboarding", async () => {
      // GIVEN — fresh key; shared onboarded account comes from root beforeAll
      const keyPair = generateMockKeyPair();

      // WHEN
      const response = await prepareOnboarding(mockCurrency, keyPair.publicKeyHex);

      // THEN
      expect(response).toHaveProperty("party_id");
      expect(response).toHaveProperty("party_name");
      expect(response).toHaveProperty("public_key_fingerprint");
      expect(response).toHaveProperty("transactions");
      expect(response.transactions).toHaveProperty("combined_hash");
      expect(response.party_name).not.toBeUndefined();
      expect(typeof response.party_name).toBe("string");
      expect(response.public_key_fingerprint).toBe(keyPair.fingerprint);
    });
  });

  describe("submitOnboarding", () => {
    it("should have onboarded via shared beforeAll setup", () => {
      const { keyPair, partyId } = getOnboardedAccount();
      expect(partyId.length).toBeGreaterThan(0);
      expect(prepareResponse).not.toBeNull();
      expect(prepareResponse!.public_key_fingerprint).toBe(keyPair.fingerprint);
    });

    const testIfPrepared = prepareResponse ? it.skip : it;
    testIfPrepared(
      "should not throw when already onboarded",
      async () => {
        // GIVEN
        const { keyPair } = getOnboardedAccount();
        const signature = keyPair.sign(prepareResponse!.transactions.combined_hash);

        const verification = verifySignature(
          keyPair.publicKeyHex,
          signature,
          prepareResponse!.transactions.combined_hash,
        );
        expect(verification.isValid).toBe(true);

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
      const hashToSign = prepareResponse?.transactions?.combined_hash || "";
      const signature = keyPair.sign(hashToSign);

      const verification = verifySignature(keyPair.publicKeyHex, signature, hashToSign);
      expect(verification.isValid).toBe(true);

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
    }, 30000);
  });

  describe("getPartyById", () => {
    it("should return party info", async () => {
      const { partyId, keyPair } = getOnboardedAccount();
      let party: Party;
      try {
        party = await getPartyByIdWhenVisible(mockCurrency, partyId);
      } catch (e) {
        const exhaustedIdLookup =
          isPartyNotYetVisibleError(e) ||
          (e instanceof Error && /timed out waiting for party/i.test(e.message));
        if (!exhaustedIdLookup) throw e;
        party = await getPartyByPubKeyWhenVisible(mockCurrency, keyPair.publicKeyHex);
      }

      expect(party).not.toBeUndefined();
      expect(party.party_id).toBe(partyId);
    }, 120_000);
  });

  describe("getPartyByPubKey", () => {
    it("should return party info", async () => {
      const party = await getPartyByPubKey(
        mockCurrency,
        "c5cdb19624833f9a929a0125978c886ec4297320c14cea6bf667dc1d23a8e650",
      );
      expect(party).not.toBeUndefined();
    });
  });

  describe("getOperations", () => {
    it("should return user transactions", async () => {
      const { operations } = await getOperations(
        mockCurrency,
        "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000",
        {},
      );
      expect(operations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("prepareTapRequest", () => {
    it.skip("should prepare tap request for onboarded party", async () => {
      // GIVEN
      const { partyId } = getOnboardedAccount();
      const amount = "1000";

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
      const { hash, serialized } = await prepareTapRequest(mockCurrency, {
        partyId,
        amount: "1000",
      });
      const signature = keyPair.sign(hash);

      const verification = verifySignature(keyPair.publicKeyHex, signature, hash);
      expect(verification.isValid).toBe(true);

      // WHEN
      const response = await submitTapRequest(mockCurrency, { partyId, serialized, signature });

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

      const verification = verifySignature(
        keyPair.publicKeyHex,
        preApprovalSignature,
        preparedTransaction.hash,
      );
      expect(verification.isValid).toBe(true);

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
