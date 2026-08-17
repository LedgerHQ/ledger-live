import invariant from "invariant";
import { createApi } from "../api";
import { TRANSACTION_TYPE } from "../constants";
import { AleoApiConfigurationResetError } from "../errors";
import { accessProvableApi } from "../network/utils";
import { getTestnetIntegConfig } from "../__tests__/fixtures/config.fixture";
import {
  referenceFailedTransferPublicTx,
  referenceTransferPublicTx,
  testnetAddress,
  testnetViewKey,
} from "../__tests__/fixtures/api.fixture";
import { setupCalStore } from "../__tests__/helpers/cal";
import { getPristineAccount } from "../__tests__/helpers/account";
import type { AleoAccountInfo, AleoContext } from "../types";

type AleoApi = ReturnType<typeof createApi>;

function requireGetAccountInfo(api: AleoApi): NonNullable<AleoApi["getAccountInfo"]> {
  const { getAccountInfo } = api;
  if (!getAccountInfo) {
    throw new Error("guard: api.getAccountInfo is not implemented");
  }
  return getAccountInfo;
}

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

  describe("listOperations", () => {
    it("returns empty array for pristine account", async () => {
      const { items: operations } = await api.listOperations(context, emptyAddress, {
        minHeight: 0,
        order: "desc",
      });

      expect(operations).toEqual([]);
    });

    it("returns operations with correct metadata", async () => {
      const { items: page } = await api.listOperations(context, testnetAddress, {
        minHeight: 0,
        limit: 10,
        order: "asc",
      });

      const operation = page.find(op => op.tx.hash === referenceTransferPublicTx.id);

      expect(operation).toMatchObject({
        type: "IN",
        value: BigInt(referenceTransferPublicTx.value),
        asset: { type: "native" },
        senders: [referenceTransferPublicTx.sender],
        recipients: [referenceTransferPublicTx.recipient],
        tx: {
          hash: referenceTransferPublicTx.id,
          fees: BigInt(referenceTransferPublicTx.fee),
          failed: false,
          block: {
            hash: referenceTransferPublicTx.blockHash,
            height: referenceTransferPublicTx.blockHeight,
          },
        },
      });
    });

    it("returns a failed operation for a known rejected transaction", async () => {
      const { items: page } = await api.listOperations(context, testnetAddress, {
        minHeight: referenceFailedTransferPublicTx.blockHeight,
        limit: 10,
        order: "asc",
      });

      const operation = page.find(op => op.tx.hash === referenceFailedTransferPublicTx.id);

      // this account's only Rejected txs are self-transfers (sender === recipient), which
      // classify as type "IN" (see referenceFailedTransferPublicTx in api.fixture.ts)
      expect(operation).toMatchObject({
        type: "IN",
        value: BigInt(referenceFailedTransferPublicTx.value),
        asset: { type: "native" },
        senders: [referenceFailedTransferPublicTx.sender],
        recipients: [referenceFailedTransferPublicTx.recipient],
        tx: {
          hash: referenceFailedTransferPublicTx.id,
          fees: BigInt(referenceFailedTransferPublicTx.fee),
          failed: true,
          block: {
            hash: referenceFailedTransferPublicTx.blockHash,
            height: referenceFailedTransferPublicTx.blockHeight,
          },
        },
      });
    });
    it.each(["desc", "asc"] as const)(
      "returns 2 non-overlapping, correctly ordered pages (%s)",
      async order => {
        const limit = 3;
        const { items: page1, next: cursor1 } = await api.listOperations(context, testnetAddress, {
          minHeight: 0,
          limit,
          order,
        });

        const { items: page2, next: cursor2 } = await api.listOperations(
          context,
          testnetAddress,
          cursor1
            ? {
                minHeight: 0,
                limit,
                order,
                cursor: cursor1,
              }
            : {
                minHeight: 0,
                limit,
                order,
              },
        );

        const firstPage1Timestamp = page1[0]?.tx?.date;
        const firstPage2Timestamp = page2[0]?.tx?.date;
        const lastPage1Timestamp = page1.at(-1)?.tx?.date;
        const lastPage2Timestamp = page2.at(-1)?.tx?.date;
        const page1Hashes = new Set(page1.map(op => op.tx.hash));
        const page2Hashes = new Set(page2.map(op => op.tx.hash));
        const hasOverlap = [...page2Hashes].some(hash => page1Hashes.has(hash));

        // NOTE: this won't be equal to limit, because single transaction can generate multiple operations
        expect(page1.length).toBeGreaterThanOrEqual(limit);
        expect(page2.length).toBeGreaterThanOrEqual(limit);
        expect(cursor1).not.toBe("");
        expect(cursor2).not.toBe("");
        expect(hasOverlap).toBe(false);
        expect(firstPage1Timestamp).toBeInstanceOf(Date);
        expect(firstPage2Timestamp).toBeInstanceOf(Date);
        expect(lastPage1Timestamp).toBeInstanceOf(Date);
        expect(lastPage2Timestamp).toBeInstanceOf(Date);
        invariant(firstPage1Timestamp, "guard: missing firstPage1Timestamp");
        invariant(firstPage2Timestamp, "guard: missing firstPage2Timestamp");
        invariant(lastPage1Timestamp, "guard: missing lastPage1Timestamp");
        invariant(lastPage2Timestamp, "guard: missing lastPage2Timestamp");
        expect(lastPage1Timestamp > firstPage2Timestamp).toBe(order === "desc");
        expect(firstPage1Timestamp < lastPage2Timestamp).toBe(order === "asc");
      },
    );

    it.each(["desc", "asc"] as const)(
      "returns operations with min height filter (%s)",
      async order => {
        const minHeight = referenceFailedTransferPublicTx.blockHeight;
        const { items: page } = await api.listOperations(context, testnetAddress, {
          minHeight,
          limit: 10,
          order,
        });

        expect(page.length).toBeGreaterThan(0);
        expect(page.every(op => op.tx.block.height >= minHeight)).toBe(true);
        expect(page.some(op => op.tx.hash === referenceTransferPublicTx.id)).toBe(false);
      },
    );
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
      const getAccountInfo = requireGetAccountInfo(api);

      const info = (await getAccountInfo(privacyContext, testnetAddress)) as AleoAccountInfo;

      expect(info.type).toBe("aleo");
      expect(typeof info.synced).toBe("boolean");
      expect(typeof info.percentage).toBe("number");
      expect(typeof info.startHeight).toBe("number");
      expect(typeof info.scannedHeight).toBe("number");
      expect(info.scannedHeight).toBeGreaterThanOrEqual(info.startHeight);
    });

    it("throws AleoApiConfigurationResetError for an unknown provableId", async () => {
      const getAccountInfo = requireGetAccountInfo(api);
      const contextWithUnknownProvableId: AleoContext = {
        ...context,
        provableId: "00000000-0000-0000-0000-000000000000",
      };

      await expect(
        getAccountInfo(contextWithUnknownProvableId, testnetAddress),
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
});
