import type { AssetInfo, Operation } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { AccountIdSchema, AccountRefSchema } from "@domain/entity-account";
import { CoinModuleSource } from "@features/platform-account-source-coin-module";
import BigNumber from "bignumber.js";
import { of } from "rxjs";
import type { Account } from "@ledgerhq/types-live";
import { adaptCoreOperationToLiveOperation } from "../bridge/generic-coin-framework/utils";
import { tokenAccountIdOf } from "./coinModulePorts";
import { FullSyncSource } from "./FullSyncSource";

const getAccountBridge = jest.fn();
jest.mock("../bridge", () => ({
  getAccountBridge: (...args: unknown[]) => getAccountBridge(...args),
}));

const parentId = AccountIdSchema.parse("js:2:ethereum:0xabc:");
const ref = AccountRefSchema.parse({
  accountId: parentId,
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
});

describe("tokenAccountIdOf", () => {
  it.each(["ethereum/erc20/usd__coin", "ethereum/erc20/some-token", "tron/trc10/1002000"])(
    "encodes %s exactly as the full sync does",
    tokenId => {
      expect(tokenAccountIdOf(parentId, tokenId)).toBe(
        encodeTokenAccountId(parentId, { id: tokenId } as TokenCurrency),
      );
    },
  );
});

// The coin module source maps a core operation straight to an AccountOperation. The full sync gets
// the same operation through the legacy adapter into an `Account`, then maps that. Both sources must
// land on the same rows.
describe("CoinModuleSource and FullSyncSource, fed the same operations", () => {
  const USDC: AssetInfo = { type: "erc20", assetReference: "0xusdc" };
  const USDC_ID = "ethereum/erc20/usd__coin";

  const core = (over: Partial<Operation>, tx: Partial<Operation["tx"]> = {}): Operation => ({
    id: "core",
    type: "OUT",
    senders: ["0xabc"],
    recipients: ["0xdef"],
    value: 100n,
    asset: { type: "native" },
    tx: {
      hash: "0xhash",
      block: { height: 42, hash: "0xblock", time: new Date("2026-01-31T12:00:00.000Z") },
      fees: 7n,
      date: new Date("2026-01-31T12:00:00.000Z"),
      failed: false,
      ...tx,
    },
    ...over,
  });

  const cases: [string, Operation][] = [
    ["a native OUT", core({}, { hash: "0x1" })],
    [
      "a native IN",
      core({ type: "IN", senders: ["0xdef"], recipients: ["0xabc"] }, { hash: "0x2" }),
    ],
    ["a native FEES", core({ type: "FEES", value: 0n }, { hash: "0x3" })],
    ["a failed native OUT", core({}, { hash: "0x4", failed: true })],
    ["a native DELEGATE", core({ type: "DELEGATE" }, { hash: "0x5" })],
    [
      "a token IN with parent senders",
      core(
        {
          type: "IN",
          asset: USDC,
          value: 25n,
          details: { parentSenders: ["0xrouter"], parentRecipients: ["0xabc"] },
        },
        { hash: "0x6" },
      ),
    ],
  ];

  const source = new CoinModuleSource({
    loadCoinModule: async () => ({
      getBalance: async () => [],
      listOperations: async () => ({ items: cases.map(([, operation]) => operation) }),
      tokenOf: async asset => (asset.type === "native" ? undefined : { id: USDC_ID }),
    }),
    families: { operations: () => ["evm"] },
    tokenAccountIdOf,
  });

  const tokenAccountId = tokenAccountIdOf(parentId, USDC_ID);
  const legacyAccount = {
    id: parentId,
    currency: { id: "ethereum" },
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operations: cases
      .filter(([, operation]) => operation.asset.type === "native")
      .map(([, operation]) => adaptCoreOperationToLiveOperation(parentId, operation)),
    subAccounts: [
      {
        type: "TokenAccount",
        id: tokenAccountId,
        parentId,
        token: { id: USDC_ID },
        balance: new BigNumber(0),
        spendableBalance: new BigNumber(0),
        operations: cases
          .filter(([, operation]) => operation.asset.type !== "native")
          .map(([, operation]) => adaptCoreOperationToLiveOperation(tokenAccountId, operation)),
      },
    ],
  } as unknown as Account;

  const fullSync = new FullSyncSource({
    getAccount: id => (id === parentId ? legacyAccount : undefined),
    prepareCurrency: async () => undefined,
  });

  it.each(cases)("maps %s to the same row", async (_label, operation) => {
    getAccountBridge.mockResolvedValue({ sync: () => of((a: Account) => a) });
    const [granular, legacy] = await Promise.all([
      source.operations(ref, undefined),
      fullSync.operations(ref, undefined),
    ]);
    const id = `${operation.asset.type === "native" ? parentId : tokenAccountId}-${operation.tx.hash}-${operation.type}`;
    const row = legacy.operations.find(candidate => candidate.id === id);
    expect(row).toBeDefined();
    expect(granular.operations.find(candidate => candidate.id === id)).toEqual(row);
  });
});
