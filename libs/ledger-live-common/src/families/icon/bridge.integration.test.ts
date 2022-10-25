import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
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
      <= 410405fce29d59eb1e39f6794782ceaea05c6ff8586796f64551b1339ac14ddef2b19a881a27a54e0aa7c8dfa5a7fcd52768d69f4b66a93b657cc8e3a578cdf6411f2a68786134616338303538343461626638353962383862663164633362346232653065356163393163373233d3c2e5cb251b607a30c6c49117093e8aeb5981e9bdb8bd6486640aa3dfdaaa9000
      => e002000115058000002c80494358800000008000000080000000
      <= 41048c417ea049b95e5b951efa2ae0bd2c8b55e06b0505703a6c7e5974cf9becb805a8bad6ed2e3d17418bf4a4265dd7559dee6d86c9aaf752e73fbe293f6e76e3232a687865376439623930653836366636653732343032383234323031386362643262326130323138363765e8acde1cc6864e7ddc354bdd3426e48904fb077fc44c17ac4daa66aa75ff91bd9000
      => e002000115058000002c80494358800000008000000080000001
      <= 4104dd233eac0a8aa004d9c8f45c53892b655c67d46a27c6a7514990bb4f768369fa8120a021c3f00629401769d61c401f110f42e33d2b8af876a256218150476a642a68783035623863663732326133623737353133616366333266306535353363653831356262316661363662a17be4c05c2c01dbbbc24108b1d2323d0d440b507392a5d51177cc8f3151869000
      => e002000115058000002c80494358800000008000000080000002
      <= 4104fb636280580b79caa83ef724a08bad797fd1aaf265110c92f30646523fa2d25ddb44013c9599ef224993d64cbceb2e2a1308cee38d3f8d8b5e2eadea1a541dee2a68783137316533313433313361623962373432386235333737623463623630376538343338663535326352cc8bbefcb8fd58bd6cf9632c491d54d04b1c17979426b7073fcda82ece33bf9000`,
    },
  ],
  accounts: [
    {
      raw: {
        id: `js:2:icon:${TEST_ADDRESS}:`,
        seedIdentifier: `${TEST_ADDRESS}`,
        name: "ICON 1",
        derivationMode: "",
        index: 0,
        freshAddress: `${TEST_ADDRESS}`,
        freshAddressPath: "44'/4801368'/0'/0'/0'",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "icon",
        unitMagnitude: 0,
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
            recipient:
              "hxedaf3b2027fbbc0a31f589299c0b34533cd8edac",
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
const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    icon,
  },
};
testBridge(dataset);
