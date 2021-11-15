import { BigNumber } from "bignumber.js";
import type { CurrenciesData } from "../../../types";
import type { NetworkInfoRaw, Transaction } from "../types";
import { fromTransactionRaw } from "../transaction";
import scanAccounts1 from "./digibyte.scanAccounts.1";
const networkInfo: NetworkInfoRaw = {
  family: "bitcoin",
  feeItems: {
    items: [
      {
        key: "0",
        speed: "high",
        feePerByte: "12",
      },
      {
        key: "1",
        speed: "standard",
        feePerByte: "8",
      },
      {
        key: "2",
        speed: "low",
        feePerByte: "1",
      },
    ],
    defaultFeePerByte: "1",
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
            family: "bitcoin",
            recipient: "DMtVdcKhnbntP1dSYYmSFNg8GK1T8aCwCb",
            amount: "500000000",
            feePerByte: "1",
            networkInfo,
            rbf: false,
            utxoStrategy: {
              strategy: 0,
              pickUnconfirmedRBF: false,
              excludeUTXOs: [],
            },
          }),
          expectedStatus: {
            amount: new BigNumber("500000000"),
            //  totalSpent: new BigNumber("500000146"),
            //  estimatedFees: new BigNumber("146"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "on segwit recipient",
          transaction: fromTransactionRaw({
            family: "bitcoin",
            recipient: "Sb4r6mx1WEZGzJvXZVqr17vYQ9yLhmjuSz",
            amount: "500000000",
            feePerByte: "1",
            networkInfo,
            rbf: false,
            utxoStrategy: {
              strategy: 0,
              pickUnconfirmedRBF: false,
              excludeUTXOs: [],
            },
          }),
          expectedStatus: {
            amount: new BigNumber("500000000"),
            //  totalSpent: new BigNumber("500000146"),
            //  estimatedFees: new BigNumber("146"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "on native_segwit recipient",
          transaction: fromTransactionRaw({
            family: "bitcoin",
            recipient: "dgb1q6c5jzgduyje29w9lsdwkd52dn3qxpcch87urdm",
            amount: "500000000",
            feePerByte: "1",
            networkInfo,
            rbf: false,
            utxoStrategy: {
              strategy: 0,
              pickUnconfirmedRBF: false,
              excludeUTXOs: [],
            },
          }),
          expectedStatus: {
            amount: new BigNumber("500000000"),
            //  totalSpent: new BigNumber("500000146"),
            //  estimatedFees: new BigNumber("146"),
            errors: {},
            warnings: {},
          },
        },
      ],
      raw: {
        id: "libcore:1:digibyte:xpub6CV98T6ompjUmKuMaULsw4UP8yfnVCg6831rWdcPjScn6RaGWrt3b7uvTpt9hcq6tLtS1dGNzeJ9x4NpVGzLq7CFscxCdoPZ6zxkqGymx98:native_segwit",
        seedIdentifier:
          "04840767650708aa9bfb14ff87409b36ee7054d635b686536d6b0c36557709dd42dbf69ae9e2e37e151140a95a400ddd2440505eb70190bb057a32f3a21766baa3",
        name: "DigiByte 1 (native segwit)",
        derivationMode: "native_segwit",
        index: 0,
        freshAddress: "dgb1qs45s7zq4gn6uygzrthyh067crzphvhwu33a8sl",
        freshAddressPath: "84'/20'/0'/0/3",
        freshAddresses: [
          {
            address: "dgb1qs45s7zq4gn6uygzrthyh067crzphvhwu33a8sl",
            derivationPath: "84'/20'/0'/0/3",
          },
        ],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "digibyte",
        unitMagnitude: 8,
        lastSyncDate: "",
        balance: "2302647120",
        xpub: "xpub6CV98T6ompjUmKuMaULsw4UP8yfnVCg6831rWdcPjScn6RaGWrt3b7uvTpt9hcq6tLtS1dGNzeJ9x4NpVGzLq7CFscxCdoPZ6zxkqGymx98",
      },
    },
    {
      raw: {
        id: "libcore:1:digibyte:xpub6CsavyNsoieEiR5QNsHZ3VQt7UzRcnKcFNXkadn1kaxsysqa2L79m3iNw6bFyJ1Vz8xYNu9ivECVvFTxydqMp4C3njLGA5PFxBid81Jinkh:segwit",
        seedIdentifier:
          "0465c9588be7d647beab52586495e2ad2dfba7bcfb9e61426cf5529016daaca48b079e38af109d588f161767318453fdcbd8e17b1f069fce4386c5147615cd41a8",
        name: "DigiByte 3 (segwit)",
        derivationMode: "segwit",
        index: 2,
        freshAddress: "SgsKPQg9CbXnon6LUeBwiwsWggQN5fUHno",
        freshAddressPath: "49'/20'/2'/0/1",
        freshAddresses: [
          {
            address: "SgsKPQg9CbXnon6LUeBwiwsWggQN5fUHno",
            derivationPath: "49'/20'/2'/0/1",
          },
        ],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "digibyte",
        unitMagnitude: 8,
        lastSyncDate: "",
        balance: "0",
        xpub: "xpub6CsavyNsoieEiR5QNsHZ3VQt7UzRcnKcFNXkadn1kaxsysqa2L79m3iNw6bFyJ1Vz8xYNu9ivECVvFTxydqMp4C3njLGA5PFxBid81Jinkh",
      },
    },
  ],
};
export default dataset;
