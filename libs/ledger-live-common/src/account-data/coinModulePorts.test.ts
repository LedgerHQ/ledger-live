import type { AssetInfo, Operation } from "@ledgerhq/coin-module-framework/api/types";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { AccountIdSchema, AccountRefSchema } from "@domain/entity-account";
import { CoinModuleSource } from "@features/platform-account-source-coin-module";
import { adaptCoreOperationToLiveOperation } from "../bridge/generic-coin-framework/utils";
import { flattenOperation } from "../legacy-mapping/accountOperation";
import { tokenAccountIdOf } from "./coinModulePorts";

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

// The coin module source maps a core operation straight to an AccountOperation. The legacy path goes
// through a live Operation first. Both must land on the same row.
describe("CoinModuleSource operation mapping, against the legacy adapter", () => {
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

  it.each(cases)("maps %s like the legacy adapter", async (_label, operation) => {
    const { operations } = await source.operations(ref, undefined);
    const isToken = operation.asset.type !== "native";
    const ownerId = isToken ? tokenAccountIdOf(parentId, USDC_ID) : parentId;
    const assetId = isToken ? USDC_ID : "ethereum";
    const [legacy] = flattenOperation(adaptCoreOperationToLiveOperation(ownerId, operation), id =>
      id === ownerId ? assetId : undefined,
    );

    expect(operations.find(row => row.id === legacy.id)).toEqual(legacy);
  });
});
