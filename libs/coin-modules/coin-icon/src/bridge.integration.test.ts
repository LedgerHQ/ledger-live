import type { DatasetTest, CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";
import BigNumber from "bignumber.js";
import {
  InvalidAddressBecauseDestinationIsAlsoSource,
  InvalidAddress,
  NotEnoughBalance,
} from "@ledgerhq/errors";

const TEST_ADDRESS = "hxe52720d9125586e64c745bf3c2c1917dbb46f9ba";

const icon: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "icon seed 1",
      apdus: `
      => e00200010d038000002c8049435880000000
      <= 410426dd3cdd69f3604e9c1d8f3021b20e133524f12894b9ef8e35d3f1f5244516d18b7bb0d1fee7b7c2972d5cde08190d66cf932d0addd5ac87f53198d050940ccb2a6878626232396531313463626434303939346136346462303137626363323233616661353135363966669fd5109b2b2077b50f18fee878efef03cef0cfb5c3256ea9e55f44fa0e9ae5289000
      => e002000115058000002c80494358800000008000000080000000
      <= 4104c1142d5b765d3026e801fd3946d9673051c7e3c3bd0eecd8ca27b6be079c9ee6b7b9f311b9eecb2995efd7e4a7ef9287a7f8878751d3227689c25a324270e8082a687863663465326339346235323631396637326161346461313333373061613663316333646164303064ff4e5e0cebe9462a469955997216658ce22953f79d272a6a1ecf3b3cdcb3549a9000
      => e002000115058000002c80494358800000008000000080000001
      <= 410429e40c4a50f96a32b622e218114c9204f66763c997dadb8c719a95d3a2d98fda3b00ccc9f3d491906d453fa2a63298817eb6af94c77a47f5eb4baa43cbb73a832a6878666330343962346365363063633539363834383764313830643963343236336536333138313733392ed566d1841e629d6f3040a23918ee84015fb60b99824d7dcadde65bcb01bb089000
      => e002000115058000002c80494358800000008000000080000002
      <= 41040310ab9742ae76a33cfb81fbb90f7d2c16af8dbe543cea73dc62dda4eb79eea4363cabad566329103dc8c6d1f29d6e005d608e35d97d80337e1ca5fd07f3da5b2a6878303139393332346162343038343733313565633339373264313738316239646363643136323061650ce87de91bb446401889398f585fc09a525bf7841dc254d94def7023b40523069000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: `js:2:icon:${TEST_ADDRESS}:`,
        seedIdentifier: `${TEST_ADDRESS}`,
        name: "ICON 1",
        derivationMode: "",
        index: 0,
        freshAddress: `${TEST_ADDRESS}`,
        freshAddressPath: "44'/4801368'/0'/0'/0'",
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "icon",
        lastSyncDate: "",
        balance: "299569965",
      },
      transactions: [
        {
          name: "recipient and sender must not be the same",
          transaction: fromTransactionRaw({
            family: "icon",
            recipient: `${TEST_ADDRESS}`,
            amount: "100000000",
            mode: "send",
            fees: "0.00125",
          }),
          expectedStatus: {
            amount: new BigNumber("100000000"),
            errors: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
          },
        },
        {
          name: "Not a valid address",
          transaction: fromTransactionRaw({
            family: "icon",
            recipient: "iconinv",
            amount: "100000000",
            mode: "send",
            fees: null,
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "Not enough balance",
          transaction: fromTransactionRaw({
            family: "icon",
            recipient: "hxedaf3b2027fbbc0a31f589299c0b34533cd8edac",
            amount: "1000000000000000000000000",
            mode: "send",
            fees: null,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
      ],
    },
  ],
};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    icon,
  },
};
