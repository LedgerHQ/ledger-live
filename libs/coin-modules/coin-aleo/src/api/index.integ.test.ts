import invariant from "invariant";
import type { Operation } from "@ledgerhq/coin-module-framework/api/types";
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
  testnetBondedMicrocredits,
  testnetBondedValidator,
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
  const stakingContext: AleoContext = {
    config: async () => getTestnetIntegConfig({ enableStaking: true }),
    logger: () => {},
  };
  let emptyAddress: string;
  let privacyContext: AleoContext;
  let stakingPrivacyContext: AleoContext;
  let emptyAddressViewKey: string;

  beforeAll(async () => {
    setupCalStore();
    const pristineAccount = await getPristineAccount();
    privacyContext = await withPrivacyContext(context, testnetViewKey);
    stakingPrivacyContext = await withPrivacyContext(stakingContext, testnetViewKey);
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

    it("reports no stake entry and nothing locked for an address with no bond", async () => {
      const emptyStakingPrivacyContext = await withPrivacyContext(
        stakingContext,
        emptyAddressViewKey,
      );

      const balance = await api.getBalance(emptyStakingPrivacyContext, emptyAddress);

      expect(balance).toEqual([{ value: 0n, asset: { type: "native" } }]);
    });

    it("adds the bonded stake to the native total as locked, on top of the liquid balance", async () => {
      const [[liquidNative], stakedBalance] = await Promise.all([
        api.getBalance(privacyContext, testnetAddress),
        api.getBalance(stakingPrivacyContext, testnetAddress),
      ]);

      expect(stakedBalance.filter(entry => entry.asset.type === "native")).toEqual([
        {
          value: liquidNative.value + testnetBondedMicrocredits,
          locked: testnetBondedMicrocredits,
          asset: { type: "native" },
        },
        {
          value: testnetBondedMicrocredits,
          asset: { type: "native" },
          stake: expect.objectContaining({
            address: testnetAddress,
            state: "active",
            delegate: testnetBondedValidator,
          }),
        },
      ]);
    });
  });

  describe("getStakes", () => {
    it("returns an empty page for an address with no bond", async () => {
      const page = await api.getStakes(stakingContext, emptyAddress);

      expect(page).toEqual({ items: [] });
    });

    it("returns the bonded testnetAddress's active stake", async () => {
      const page = await api.getStakes(stakingContext, testnetAddress);

      expect(page.items).toEqual([
        expect.objectContaining({
          uid: testnetAddress,
          address: testnetAddress,
          state: "active",
          actions: ["delegate", "undelegate"],
          delegate: testnetBondedValidator,
          asset: { type: "native" },
          amount: testnetBondedMicrocredits,
        }),
      ]);
    });
  });

  describe("getValidators", () => {
    it("reads the validator committee", async () => {
      const page = await api.getValidators(context);

      expect(page.items.length).toBeGreaterThan(0);
      page.items.forEach(validator => {
        expect(validator.id).toBe(validator.address);
        expect(validator.name.length).toBeGreaterThan(0);
        expect(validator.balance).toBeGreaterThan(0n);
        expect(Number(validator.commissionRate)).toBeGreaterThanOrEqual(0);
        expect(Number(validator.commissionRate)).toBeLessThanOrEqual(100);
        expect(validator.apy ?? 0).toBeGreaterThanOrEqual(0);
        expect(validator.apy ?? 0).toBeLessThanOrEqual(1);
      });
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

    describe("fees", () => {
      const sponsor = "aleo1xaytw2vtvhz2szhgjzqetadzjd92w2fdx233vq4fq3jdfd9ety8sna28t3";
      const operationsById = new Map<string, Operation>();

      beforeAll(async () => {
        let cursor: string | undefined;
        do {
          const page = await api.listOperations(stakingPrivacyContext, testnetAddress, {
            minHeight: firstActivityBlock,
            order: "desc",
            limit: 50,
            ...(cursor && { cursor }),
          });
          for (const op of page.items) operationsById.set(op.id, op);
          cursor = page.next;
        } while (cursor);
      });

      function getOperation(id: string): Operation {
        const op = operationsById.get(id);
        invariant(op, `guard: ${id} is missing from the account history`);
        return op;
      }

      it.each([
        ["at1dj2hj6pufrcrqfzuuetg26h2sntpecn7jfc3lddqkkr8n5w9nqfqpwj874", testnetAddress],
        ["at19p0dlt05nv06dnvk2wymd2denkke8kgzc7k5w8x6tzjk9rsamvysglmznk", testnetAddress],
        ["at1nt43e57g0nypf7h9saujnceyshtev56aqv69juqyxgmagv2qs5zqzcw7tt", testnetAddress],
        ["at1jxfrgfn094jsj7qsqnn7acnzss0kj8avqa49uxwtkaexvj44cqxsnzrtfh", testnetAddress],
        ["at10jt4v3glr9pkrpndqclgasqa8ed4hu0gj7r3qujmqhmaekrv05qq5a6tsx", testnetAddress],
        ["at1v6ltk8nl59xygf47jkfzkky20jqcune2a8e9e7juw5ge4ksegg9sl92e4n", testnetAddress],
        ["at1t76kdj3acv28n9x5x6fynpgcxe2jak060ne3cm9r9h4vkpffrg9s8uw7lt", testnetAddress],
        ["at1jkllchgezse0hx5wkyxh3ljweqpyg47958wdcnrjcnj94ratzu8qls8ksn", sponsor],
        ["at195ql6qgnjez6cmshd08axspr4wze8w3k93pydpml2qeqtrtf3ursn7aest", sponsor],
        ["at1qsk9cnzh0wp3tu8qs7v97sydx0u7qakg7spd306tdq77feca0yxqr6mcqx", sponsor],
        ["at1ru0pnp4djgdd4cxpmjsaqkzke9gcmx20ensxfk4pev6gylz4xs8spszpn6", sponsor],
        [
          "at193lqmmxlce4e5zhne9tlmurpa7s43e7pm0cq6a9gh6wvz8d40qpshvkh83",
          "aleo10ju2x3ktenzaacscg9rreln4q99rehh7plsnk8r6t300pgn49c8qqdrkqy",
        ],
        [
          "at1c92r7gpfdyraelghc4j4ntz3rkkpx4lkj49p4qsq2wrk468vavyq529wx0",
          "aleo1dtadcxqsjp4fvvafv4ynlq9mp5vgwsap7djlzell8ngag7pj3uysdlhxjs",
        ],
        ["at1qfj30cc84vcfdfxpv7prxscs8sxejwa2lny3lsk97u6snm7qdyps4zn0zy", undefined],
        ["at1tpm2ara52q2udq9adaga348wxsrvf8tukgg4mpk7hwm4rnm8l5yql3w8z9", undefined],
      ])("sets the fees payer of %s to %s", (id, feesPayer) => {
        expect(getOperation(id).tx.feesPayer).toBe(feesPayer);
      });

      it.each([
        ["at144a06el45t8vd009u3pnmgyy5ks3r3ge38zpfrd3mdwezluf3vqs54gjkt", 2318n],
        ["at1yh3ydeha8kujptnnwlx9u60rycwsh3wknevdgqxjq8wasmwpjq9sj2ljmt", 2304n],
        ["at1gte28m0et2trw2xm2n9hjs28398h5pvke0x8ml7wtr5w8crcdvqsswpp70", 2304n],
        ["at1kce4wgkyssz0ku9zrkdr448d7mcchgxx9g5mwch89r0x6hnqrvxsjwuqxc", 2825n],
      ])("charges %s's fee of %s, priority fee included, to the account", (id, fees) => {
        const op = getOperation(id);

        expect(op.tx.feesPayer).toBe(testnetAddress);
        expect(op.tx.fees).toBe(fees);
      });

      it("keeps a bond's value at 0 and puts the bond in details.stake", () => {
        const bond = getOperation("at12c59u57ehxv6utj0pl66d6a58ca8ml9uptttreqzx2jwv7d04q9qwjue6y");

        expect(bond.value).toBe(0n);
        expect(bond.tx.feesPayer).toBe(testnetAddress);
        expect(bond.tx.fees).toBe(5621n);
        expect(bond.details).toMatchObject({
          stake: { address: testnetBondedValidator, amount: testnetBondedMicrocredits },
        });
      });
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
