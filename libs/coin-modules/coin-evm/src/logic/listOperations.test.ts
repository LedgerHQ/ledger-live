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
  ])("list latest operations using %s", async (_, type, explorer) => {
    setCoinConfig(() => ({ info: { explorer: { type } } }) as unknown as EvmCoinConfig);
    jest.spyOn(explorer, "getLastOperations").mockResolvedValue({
      lastCoinOperations: [
        {
          id: "native-op-1",
          accountId: "",
          type: "IN",
          senders: ["address1"],
          recipients: ["address"],
          value: new BigNumber(4),
          hash: "native-op-1-tx-hash",
          blockHeight: 10,
          blockHash: "native-op-1-block-hash",
          fee: new BigNumber(20),
          date: new Date("2025-02-12"),
          extra: {},
        },
        {
          id: "native-op-2",
          accountId: "",
          type: "OUT",
          senders: ["address"],
          recipients: ["address2"],
          value: new BigNumber(8),
          hash: "native-op-2-tx-hash",
          blockHeight: 20,
          blockHash: "native-op-2-block-hash",
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
      ],
      lastNftOperations: [],
      lastInternalOperations: [],
    });

    expect(await listOperations({} as CryptoCurrency, "address", { minHeight: 5 })).toEqual([
      [
        {
          id: "native-op-1",
          type: "IN",
          senders: ["address1"],
          recipients: ["address"],
          value: 4n,
          asset: { type: "native" },
          tx: {
            hash: "native-op-1-tx-hash",
            block: {
              height: 10,
              hash: "native-op-1-block-hash",
            },
            fees: 20n,
            date: new Date("2025-02-12"),
          },
        },
        {
          id: "native-op-2",
          type: "OUT",
          senders: ["address"],
          recipients: ["address2"],
          value: 8n,
          asset: { type: "native" },
          tx: {
            hash: "native-op-2-tx-hash",
            block: {
              height: 20,
              hash: "native-op-2-block-hash",
            },
            fees: 20n,
            date: new Date("2025-02-20"),
          },
        },
        {
          id: "token-op-1",
          type: "OUT",
          senders: ["address"],
          recipients: ["address1"],
          value: 1n,
          asset: { type: "erc20", assetReference: "contract-address" },
          tx: {
            hash: "token-op-1-tx-hash",
            block: {
              height: 20,
              hash: "token-op-1-block-hash",
            },
            fees: 20n,
            date: new Date("2025-02-20"),
          },
        },
      ],
      "",
    ]);
  });
});
