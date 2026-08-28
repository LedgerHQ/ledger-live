import invariant from "invariant";
import { createApi } from "../api";
import { TRANSACTION_TYPE } from "../constants";
import { AleoApiConfigurationResetError } from "../errors";
import { fromHex } from "../logic/utils";
import { accessProvableApi } from "../network/utils";
import { getTestnetIntegConfig } from "../__tests__/fixtures/config.fixture";
import {
  referenceTransferPublicTx,
  TEST_TOKEN_PROGRAM_ID,
  testnetAddress,
  testnetIncomingPrivateRecord1,
  testnetSelfConversionTx,
  testnetViewKey,
} from "../__tests__/fixtures/api.fixture";
import { setupCalStore } from "../__tests__/helpers/cal";
import { getPristineAccount } from "../__tests__/helpers/account";
import type { AleoAccountInfo, AleoContext, PreparedRequestResponse } from "../types";
import {
  mockTxIntentTransferPrivate,
  mockTxIntentTransferPublic,
} from "../__tests__/fixtures/transaction.fixture";

async function withPrivacyContext(context: AleoContext, viewKey: string): Promise<AleoContext> {
  const config = await context.config();
  const provableApi = await accessProvableApi({
    config,
    viewKey,
    provableApi: null,
  });

  invariant(provableApi.uuid, "guard: missing provableApi.uuid");

  return { ...context, provableId: provableApi.uuid, viewKey };
}

describe("createApi", () => {
  const api = createApi("aleo_testnet");
  const context: AleoContext = {
    config: async () => getTestnetIntegConfig(),
    logger: () => {},
  };
  let emptyAddress: string;
  let privacyContext: AleoContext;
  let emptyAddressViewKey: string;

  beforeAll(async () => {
    setupCalStore();
    const pristineAccount = await getPristineAccount();
    privacyContext = await withPrivacyContext(context, testnetViewKey);
    emptyAddress = pristineAccount.address;
    emptyAddressViewKey = pristineAccount.viewKey;
  });

  describe("craftTransaction", () => {
    it("crafts a prepared request for a public root intent", async () => {
      const result = await api.craftTransaction(context, mockTxIntentTransferPublic);

      const preparedRequest = fromHex<PreparedRequestResponse>(result.transaction);
      expect(preparedRequest.function_name.toLowerCase()).toContain(
        Buffer.from("transfer_public").toString("hex"),
      );
    });

    it("crafts a prepared request for a private root intent when a viewKey is present", async () => {
      const contextWithPrivacy = await withPrivacyContext(context, testnetViewKey);

      const result = await api.craftTransaction(contextWithPrivacy, mockTxIntentTransferPrivate);

      const preparedRequest = fromHex<PreparedRequestResponse>(result.transaction);
      expect(preparedRequest.function_name.toLowerCase()).toContain(
        Buffer.from("transfer_private").toString("hex"),
      );
    });
  });

  describe("combine", () => {
    it("rejects an invalid signature with an HTTP error from the backend", async () => {
      const contextWithViewKey: AleoContext = { ...context, viewKey: testnetViewKey };
      const crafted = await api.craftTransaction(context, mockTxIntentTransferPublic);

      await expect(
        api.combine(contextWithViewKey, crafted.transaction, ["sign1invalidsignatureplaceholder"]),
      ).rejects.toMatchObject({ status: expect.any(Number) });
    });

    it("rejects before any network call when the context carries no view key", async () => {
      await expect(api.combine(context, "crafted-tx", ["root-sig"])).rejects.toThrow(
        /view key is required/,
      );
    });
  });

  describe("estimateFees", () => {
    it("returns fee for coin transfer transaction", async () => {
      const fees = await api.estimateFees(context, {
        intentType: "transaction",
        asset: { type: "native" },
        type: TRANSACTION_TYPE.TRANSFER_PUBLIC,
        amount: 100n,
        sender: testnetAddress,
        recipient: emptyAddress,
      });

      expect(fees.value).toBeGreaterThanOrEqual(0n);
    });
  });

  describe("lastBlock", () => {
    it("returns the last block information", async () => {
      const lastBlock = await api.lastBlock(context);

      expect(lastBlock.height).toBeGreaterThan(0);
      expect(lastBlock.hash?.length).toBeGreaterThan(0);
      expect(lastBlock.time?.getTime()).toBeGreaterThan(0);
    });
  });

  describe("getAccountInfo", () => {
    it("returns the aleo scan status for a registered provableId", async () => {
      const info = (await api.getAccountInfo(privacyContext, testnetAddress)) as AleoAccountInfo;

      expect(info.type).toBe("aleo");
      expect(typeof info.synced).toBe("boolean");
      expect(typeof info.percentage).toBe("number");
      expect(typeof info.startHeight).toBe("number");
      expect(typeof info.scannedHeight).toBe("number");
      expect(info.scannedHeight).toBeGreaterThanOrEqual(info.startHeight);
    });

    it("throws AleoApiConfigurationResetError for an unknown provableId", async () => {
      const contextWithUnknownProvableId: AleoContext = {
        ...context,
        provableId: "00000000-0000-0000-0000-000000000000",
      };

      await expect(
        api.getAccountInfo(contextWithUnknownProvableId, testnetAddress),
      ).rejects.toBeInstanceOf(AleoApiConfigurationResetError);
    });
  });

  describe("getBalance", () => {
    it("throws when no privacy context is given", async () => {
      await expect(api.getBalance(context, testnetAddress)).rejects.toThrow(
        "aleo: provableId is missing",
      );
    });

    it("throws an error for an invalid address", async () => {
      const invalidAddress = "invalid_address";

      await expect(api.getBalance(privacyContext, invalidAddress)).rejects.toMatchObject({
        name: "LedgerAPI4xx",
        status: 404,
      });
    });

    it("combines public and private balances for a native + token account", async () => {
      const balance = await api.getBalance(privacyContext, testnetAddress);
      const native = balance.find(entry => entry.asset.type === "native");
      const tokens = balance.filter(entry => entry.asset.type === "arc22");

      expect(native?.value).toBeGreaterThan(0n);
      expect(tokens.length).toBeGreaterThan(0);
    });

    it("returns a zero native entry for a non-existing valid address", async () => {
      const emptyPrivacyContext = await withPrivacyContext(context, emptyAddressViewKey);

      const balance = await api.getBalance(emptyPrivacyContext, emptyAddress);

      expect(balance).toEqual([{ value: 0n, asset: { type: "native" } }]);
    });
  });

  describe("listOperations", () => {
    // The fixtures below all sit in the account's 18_140_1xx–18_140_9xx activity burst
    const firstActivityBlock = referenceTransferPublicTx.blockHeight - 10;

    it("throws when no privacy context is given", async () => {
      await expect(api.listOperations(context, testnetAddress, { minHeight: 0 })).rejects.toThrow(
        "aleo: provableId is missing",
      );
    });

    it("resolves a counterparty the explorer left blank to the account's own address", async () => {
      const { items } = await api.listOperations(privacyContext, testnetAddress, {
        minHeight: testnetSelfConversionTx.block_number - 1,
        order: "desc",
      });

      const shield = items.find(op => op.id === testnetSelfConversionTx.transaction_id);

      invariant(shield, "guard: the shielding transaction is missing from the page");
      expect(shield.recipients).toEqual([testnetAddress]);
      expect(shield.type).toBe("OUT");
    });

    it("emits an operation for a token transaction that has no public row", async () => {
      const { items } = await api.listOperations(privacyContext, testnetAddress, {
        minHeight: firstActivityBlock,
        order: "desc",
      });

      const privateOnly = items.find(
        op => op.id === testnetIncomingPrivateRecord1.transaction_id.trim(),
      );

      invariant(privateOnly, "guard: the private-only token transaction is missing from the page");
      expect(privateOnly.type).toBe("IN");
      expect(privateOnly.asset).toMatchObject({ assetReference: TEST_TOKEN_PROGRAM_ID });
      expect(privateOnly.details).toMatchObject({ transactionType: "private" });
    });

    it("never lists a block the record scanner has not reached", async () => {
      const info = (await api.getAccountInfo(privacyContext, testnetAddress)) as AleoAccountInfo;

      const { items } = await api.listOperations(privacyContext, testnetAddress, {
        minHeight: firstActivityBlock,
        order: "desc",
      });

      expect(items.length).toBeGreaterThan(0);
      for (const op of items) {
        expect(op.tx.block.height).toBeLessThanOrEqual(info.scannedHeight);
      }
    });

    it("resumes the next page past the last block of the previous one", async () => {
      const options = { minHeight: firstActivityBlock, limit: 2, order: "desc" as const };

      const firstPage = await api.listOperations(privacyContext, testnetAddress, options);

      invariant(firstPage.next, "guard: expected the account's history to span several pages");

      const secondPage = await api.listOperations(privacyContext, testnetAddress, {
        ...options,
        cursor: firstPage.next,
      });

      const firstIds = new Set(firstPage.items.map(op => op.id));
      const overlap = secondPage.items.filter(op => firstIds.has(op.id));

      expect(overlap).toEqual([]);
      expect(Math.max(...secondPage.items.map(op => op.tx.block.height))).toBeLessThan(
        Math.min(...firstPage.items.map(op => op.tx.block.height)),
      );
    });

    it("emits exactly one operation per transaction", async () => {
      const { items } = await api.listOperations(privacyContext, testnetAddress, {
        minHeight: firstActivityBlock,
        order: "desc",
      });

      expect(items.length).toBeGreaterThan(0);
      expect(new Set(items.map(op => op.id)).size).toBe(items.length);
    });

    it("rejects a malformed cursor before any network call", async () => {
      await expect(
        api.listOperations(privacyContext, testnetAddress, {
          minHeight: 0,
          cursor: "not-a-height",
        }),
      ).rejects.toThrow(/malformed listOperations cursor/);
    });
  });

  describe("register", () => {
    it("reads the view key off the context and enrolls it into the testnet scanner", async () => {
      const contextWithViewKey: AleoContext = { ...context, viewKey: testnetViewKey };

      const result = await api.register(contextWithViewKey, testnetAddress);

      invariant(result.type === "aleo", "guard: expected an aleo registration handle");
      expect(typeof result.provableId).toBe("string");
      expect(result.provableId.length).toBeGreaterThan(0);
    });

    it("rejects before any network call when the context carries no view key", async () => {
      await expect(api.register(context, testnetAddress)).rejects.toThrow(/view key is required/);
    });
  });
});
