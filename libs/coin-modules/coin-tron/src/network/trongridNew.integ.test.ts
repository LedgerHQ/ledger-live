import { getTransactions } from "./trongridNew";
import { setCoinConfig } from "../config";
import BigNumber from "bignumber.js";

describe("Network calls", () => {
  beforeAll(() => {
    setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: "https://tron.coin.ledger.com",
      },
    }));
  });

  describe("fetchTronAccountTxs", () => {
    it.only(
      "maps all fields correctly",
      async () => {
        // WHEN
        const addr = "TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre";
        const results = await getTransactions(addr, 65000000);

        // THEN
        expect(results).toHaveLength(9);
        // TransactionTronAPI version
        // {
        //   blockNumber: 65925177,
        //   block_timestamp: 1728424242000,
        //   energy_fee: 0,
        //   energy_usage: 0,
        //   energy_usage_total: 0,
        //   internal_transactions: [],
        //   net_fee: 0,
        //   net_usage: 265,
        //   raw_data: {
        //     contract: [
        //       {
        //         parameter: {
        //           type_url: "type.googleapis.com/protocol.TransferContract",
        //           value: {
        //             amount: 5,
        //             owner_address: "415d6ae2b339652ea1852cc065e0fc9dd2ab82d2ef",
        //             to_address: "416e3b44b96104b26f84057974a1f0c9880f7c9b13",
        //           },
        //         },
        //         type: "TransferContract",
        //       },
        //     ],
        //     expiration: 1728424299000,
        //     ref_block_bytes: "f026",
        //     ref_block_hash: "34a78fc2a4585665",
        //     timestamp: 1728424241028,
        //   },
        //   raw_data_hex:
        //     "0a02f026220834a78fc2a458566540f893f7f0a6325a65080112610a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412300a15415d6ae2b339652ea1852cc065e0fc9dd2ab82d2ef1215416e3b44b96104b26f84057974a1f0c9880f7c9b1318057084cff3f0a632",
        //   ret: [{ contractRet: "SUCCESS", fee: 0 }],
        //   signature: [
        //     "2dac962f4a8d858449373c454687e5e317ef4a80e84a454463df6d45f6281ce6414c188f075fe2986c66a6b35c7b2b41a07c0adb3add7de8417624766ffece1c01",
        //   ],
        //   txID: "a3eed8026aabeaac58ce98124b0952acc726536ec9f63efdba0cc0e2a1293c3f",
        // }
        expect(results[0]).toEqual({
          blockHeight: 65925177,
          date: new Date(1728424242000),
          fee: new BigNumber("0"),
          from: "TJV9tSK9nDW9rn4EPyiUJ5zuxGfydC1zJR",
          hasFailed: false,
          to: "TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre",
          tokenId: undefined,
          txID: "a3eed8026aabeaac58ce98124b0952acc726536ec9f63efdba0cc0e2a1293c3f",
          type: "TransferContract",
          value: new BigNumber("5"),
        });
        const descendantOrderedTxs = [
          "a3eed8026aabeaac58ce98124b0952acc726536ec9f63efdba0cc0e2a1293c3f",
          "0c433417f755077fa412abf8e2958d502740e3327b73a1a83e69e13396358c7e",
          "009fa37f1462c4eb40920ac4da20a78b3bf100d128df715a76ad10a73a6cbded",
          "954174876f81aaa16c279307e12de179affd284f13a0fcf609fe2ffb282d69ca",
          "1da9bcf83f08262779443950c3bcb2d8983d476c7182bf1c89f70468dae1fbb5",
          "dbca0cc1a4856d8b9e0d5b35df95aed0ed1c4f28a8660bc7ede8c22eb4ee1ecb",
          "37a8a1cf504a1b5d777f23ab5e553b92bc9fca6c56ccf7cd8c9f82a13d9d1af3",
          "5364d83113409e07330c8af72a6334c2c49b0909cbf68191eba734d23131427f",
          "534bfce5915947b088a6e5420166d864d086699fa8c9447b4011b94c91735459",
        ];
        expect(results.map(a => a.txID)).toEqual(descendantOrderedTxs);
      },
      10 * 1000,
    );
  });
});
