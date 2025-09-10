import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { EvmCoinConfig, setCoinConfig } from "../config";
import etherscanExplorer from "../network/explorer/etherscan";
import ledgerExplorer from "../network/explorer/ledger";
import { listOperations } from "./listOperations";

describe("listOperations", () => {
  it.each([
    ["an etherscan explorer", "etherscan", etherscanExplorer],
    ["a ledger explorer", "ledger", ledgerExplorer],
  ])("lists latest operations using %s", async (_, type, explorer) => {
    setCoinConfig(() => ({ info: { explorer: { type } } }) as unknown as EvmCoinConfig);
    jest.spyOn(explorer, "getLastOperations").mockResolvedValue({
      lastCoinOperations: [
        {
          id: "coin-op-1",
          accountId: "",
          type: "IN",
          senders: ["address1"],
          recipients: ["address"],
          value: new BigNumber(4),
          hash: "coin-op-1-tx-hash",
          blockHeight: 10,
          blockHash: "coin-op-1-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-12"),
          extra: {},
        },
        {
          id: "coin-op-2",
          accountId: "",
          type: "OUT",
          senders: ["address"],
          recipients: ["address2"],
          value: new BigNumber(28),
          hash: "coin-op-2-tx-hash",
          blockHeight: 20,
          blockHash: "coin-op-2-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-20"),
          extra: {},
        },
        {
          id: "coin-op-3",
          accountId: "",
          type: "FEES",
          senders: ["address"],
          recipients: ["contract-address"],
          value: new BigNumber(0),
          hash: "token-op-1-tx-hash",
          blockHeight: 20,
          blockHash: "coin-op-2-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-20"),
          extra: {},
        },
        {
          id: "coin-op-4",
          accountId: "",
          type: "NONE",
          senders: ["address1"],
          recipients: ["address2"],
          value: new BigNumber(0),
          hash: "token-op-2-tx-hash",
          blockHeight: 20,
          blockHash: "coin-op-2-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-20"),
          extra: {},
        },
      ],
      lastTokenOperations: [
        {
          id: "token-op-1",
          accountId: "",
          type: "OUT",
          senders: ["address"],
          recipients: ["address1"],
          contract: "contract-address",
          value: new BigNumber(1),
          hash: "token-op-1-tx-hash",
          blockHeight: 20,
          blockHash: "token-op-1-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-20"),
          extra: {},
        },
        {
          id: "token-op-2",
          accountId: "",
          type: "IN",
          senders: ["address"],
          recipients: ["address2"],
          contract: "contract-address",
          value: new BigNumber(2),
          hash: "token-op-2-tx-hash",
          blockHeight: 20,
          blockHash: "token-op-2-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-20"),
          extra: {},
        },
      ],
      lastNftOperations: [],
      lastInternalOperations: [],
    });

    expect(await listOperations({} as CryptoCurrency, "address", 5)).toEqual([
      [
        {
          id: "coin-op-1",
          type: "IN",
          senders: ["address1"],
          recipients: ["address"],
          value: 4n,
          asset: { type: "native" },
          tx: {
            hash: "coin-op-1-tx-hash",
            block: {
              height: 10,
              hash: "coin-op-1-block-hash",
            },
            fees: 20n,
            date: new Date("2025-02-12"),
          },
          details: { ledgerOpType: "IN" },
        },
        {
          id: "coin-op-2",
          type: "OUT",
          senders: ["address"],
          recipients: ["address2"],
          value: 8n,
          asset: { type: "native" },
          tx: {
            hash: "coin-op-2-tx-hash",
            block: {
              height: 20,
              hash: "coin-op-2-block-hash",
            },
            fees: 20n,
            date: new Date("2025-02-20"),
          },
          details: { ledgerOpType: "OUT" },
        },
        {
          id: "token-op-1",
          type: "FEES",
          senders: ["address"],
          recipients: ["address1"],
          value: 20n,
          asset: { type: "erc20", assetReference: "contract-address", assetOwner: "address" },
          tx: {
            hash: "token-op-1-tx-hash",
            block: {
              height: 20,
              hash: "token-op-1-block-hash",
            },
            fees: 20n,
            date: new Date("2025-02-20"),
          },
          details: { ledgerOpType: "OUT", assetAmount: 1n },
        },
        {
          id: "token-op-2",
          type: "NONE",
          senders: ["address"],
          recipients: ["address2"],
          value: 2n,
          asset: {
            assetOwner: "address",
            assetReference: "contract-address",
            type: "erc20",
          },
          tx: {
            hash: "token-op-2-tx-hash",
            block: {
              hash: "token-op-2-block-hash",
              height: 20,
            },
            date: new Date("2025-02-20"),
            fees: 20n,
          },
          details: {
            assetAmount: 2n,
            ledgerOpType: "IN",
          },
        },
      ],
      "",
    ]);
  });
});
