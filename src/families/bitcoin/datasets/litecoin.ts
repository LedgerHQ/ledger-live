import { BigNumber } from "bignumber.js";
import type { CurrenciesData } from "../../../types";
import type { NetworkInfoRaw, Transaction } from "../types";
import { fromTransactionRaw } from "../transaction";
import scanAccounts1 from "./litecoin.scanAccounts.1";
const networkInfo: NetworkInfoRaw = {
  family: "bitcoin",
  feeItems: {
    items: [
      {
        key: "0",
        speed: "high",
        feePerByte: "100",
      },
      {
        key: "1",
        speed: "standard",
        feePerByte: "100",
      },
      {
        key: "2",
        speed: "low",
        feePerByte: "100",
      },
    ],
    defaultFeePerByte: "39",
  },
};
const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: [
    "bitcoinResources.walletAccount", // it is not "stable"
    "bitcoinResources.utxos", // TODO: fix ordering
  ],
  scanAccounts: [scanAccounts1],
  accounts: [
    {
      transactions: [
        {
          name: "on legacy recipient",
          transaction: fromTransactionRaw({
            amount: "200000",
            recipient: "LLVLXPBzLTHYjF5Q4r6iCEEztCmWecazwP",
            useAllAmount: false,
            family: "bitcoin",
            feePerByte: "39",
            networkInfo,
            rbf: false,
            utxoStrategy: {
              strategy: 0,
              pickUnconfirmedRBF: false,
              excludeUTXOs: [],
            },
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
            //  estimatedFees: new BigNumber("5694"),
            amount: new BigNumber("200000"), //  totalSpent: new BigNumber("205694")
          },
        },
        {
          name: "on segwit recipient",
          transaction: fromTransactionRaw({
            amount: "147200",
            recipient: "MGWgRF4qLAHtYhEe6VcQNeQRxVhPd3evHc",
            useAllAmount: false,
            family: "bitcoin",
            feePerByte: "39",
            networkInfo,
            rbf: false,
            utxoStrategy: {
              strategy: 0,
              pickUnconfirmedRBF: false,
              excludeUTXOs: [],
            },
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
            //  estimatedFees: new BigNumber("5694"),
            amount: new BigNumber("147200"), //  totalSpent: new BigNumber("152894")
          },
        },
        {
          name: "on nativ_segwit recipient",
          transaction: fromTransactionRaw({
            amount: "205273",
            recipient: "ltc1qd2x2x0wf3wgkka87qlm8772tuw6yx6fl9j07ag",
            useAllAmount: false,
            family: "bitcoin",
            feePerByte: "39",
            networkInfo,
            rbf: false,
            utxoStrategy: {
              strategy: 0,
              pickUnconfirmedRBF: false,
              excludeUTXOs: [],
            },
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
            //  estimatedFees: new BigNumber("5694"),
            amount: new BigNumber("205273"), //  totalSpent: new BigNumber("210967")
          },
        },
      ],
      raw: {
        id: "libcore:1:litecoin:Ltub2ZDyeYFtDj5kHy4w5WaXBDE9217rNDYfmv7u5NV8dk8vKdmkqAfPdwRma5rkPcj5daMU8JiiLXQYPX9rtqEzrK1YrmkofcpADTV7s5FgzLF:native_segwit",
        seedIdentifier:
          "046fc19d6536e34ada42efa9e41aa2e6c316ce2844b57feb82155c2f4fdbbd5fddf2e03996787af3d982648f7ea2243bd60885d34658bd55b8470e6809a4c04fc3",
        name: "Litecoin 1 (native segwit)",
        derivationMode: "native_segwit",
        index: 0,
        freshAddress: "ltc1qx2wxzwmpg4m8tr9d7rharerxaqj50jkdasvxmx",
        freshAddressPath: "84'/2'/0'/0/3",
        freshAddresses: [
          {
            address: "ltc1qx2wxzwmpg4m8tr9d7rharerxaqj50jkdasvxmx",
            derivationPath: "84'/2'/0'/0/3",
          },
        ],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "litecoin",
        unitMagnitude: 8,
        lastSyncDate: "",
        balance: "2183515",
        xpub: "Ltub2ZDyeYFtDj5kHy4w5WaXBDE9217rNDYfmv7u5NV8dk8vKdmkqAfPdwRma5rkPcj5daMU8JiiLXQYPX9rtqEzrK1YrmkofcpADTV7s5FgzLF",
      },
    },
    {
      raw: {
        id: "libcore:1:litecoin:Ltub2Yz97oUCaVDo1Ak6FJ1Fvg2EscNzrWvLYxnXeY7rrArUPpdfgUAEWM49MrjVBNrdjwgFnMbqKGh8XkUdQFx3h8y1SDcak4vGSbqKM5PR8Rr:segwit",
        seedIdentifier:
          "04d7d329aa21c8425cf58ebf7f3c27afe3967c44bd23d3caccfa6beff04110c249418a6a98a1145b0ea1bf489ea84ebe3e66e46f4bd376130b16823a2805ba6ec9",
        name: "Litecoin 3 (segwit)",
        derivationMode: "segwit",
        index: 2,
        freshAddress: "MKLFUqcvJkqqvF48BFTFLxDvJk43cqbhk1",
        freshAddressPath: "49'/2'/2'/0/1",
        freshAddresses: [
          {
            address: "MKLFUqcvJkqqvF48BFTFLxDvJk43cqbhk1",
            derivationPath: "49'/2'/2'/0/1",
          },
        ],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "litecoin",
        unitMagnitude: 8,
        lastSyncDate: "",
        balance: "0",
        xpub: "Ltub2Yz97oUCaVDo1Ak6FJ1Fvg2EscNzrWvLYxnXeY7rrArUPpdfgUAEWM49MrjVBNrdjwgFnMbqKGh8XkUdQFx3h8y1SDcak4vGSbqKM5PR8Rr",
      },
    },
  ],
};
export default dataset;
