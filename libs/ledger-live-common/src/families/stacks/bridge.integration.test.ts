import { CurrenciesData } from "@ledgerhq/types-live";
import { AnchorMode } from "@stacks/transactions";
import type { DatasetTest } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
} from "@ledgerhq/errors";

import "../../__tests__/test-helpers/setup";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";
import { testBridge } from "../../__tests__/test-helpers/bridge";

const SEED_IDENTIFIER = "SP3KS7VMY2ZNE6SB88PHR4SKRK2EEPHS8N8MCCBR9";
const ACCOUNT_1 = "SP2DV2RVZP1A69Q6VAG5PHEQ6ZHQHZPCV84TMYNGN";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const stacks: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: [],
  scanAccounts: [
    {
      name: "stacks seed 1",
      apdus: `
      => 09010016142c0000807d160080000000800000000000000000
      <= 02c242956d48c573766053cecf72cceb543104db78bedd219dea9a082a7563b71653503236415a314a53465a51383256483557324e4a53423251573135455735594b5436574d4436394a9000
      => 09010016142c0000807d160080000000800000000001000000
      <= 03506e18b6099ad866156af61ff6bf1cc6c64565d6a1c5e2d5713e0c0852a72d02535032304e38374534574e56335139343851423432305a5637465244333045453644354d32574238439000
      => 09010016142c0000807d160080010000800000000000000000
      <= 027d02c07fa445fb4e03212614db667d7f9aed4905fcc808633f5e2d478fbe0f7453504e583959593354344752345844534e52565742324d44515643544a4d50334247543756435a419000
      => 09010016142c0000807d160080020000800000000000000000
      <= 03c6b6c94304d900273723970cf7b76b5da74504dc48c66bf827ec73e250bfe84653505430444d5a5a3851544e335a3739594e444d4d5a32574639314244364d353953395a3130599000
      => 09010016142c0000807d160080030000800000000000000000
      <= 023a267b1d864bca3d46c328ad4697e722caecc6eb14988f14f7d9c182da4de3e653503147435254564d54563948463443443139564845314d584d4e50514551433146543659574635599000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: `js:2:stacks:${SEED_IDENTIFIER}:`,
        seedIdentifier: SEED_IDENTIFIER,
        name: "Stacks 1",
        derivationMode: "",
        index: 0,
        freshAddress: SEED_IDENTIFIER,
        freshAddressPath: "44'/5757'/0'/0/0",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "stacks",
        unitMagnitude: 6,
        lastSyncDate: "",
        balance: "1000",
      },
      transactions: [
        {
          name: "Source and destination are the equal",
          transaction: fromTransactionRaw({
            family: "stacks",
            nonce: "1",
            network: "mainnet",
            anchorMode: AnchorMode.Any,
            recipient: SEED_IDENTIFIER,
            amount: "1",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
          },
        },
        {
          name: "Not enough balance",
          transaction: fromTransactionRaw({
            family: "stacks",
            nonce: "1",
            network: "mainnet",
            anchorMode: AnchorMode.Any,
            recipient: ACCOUNT_1,
            amount: "100000000000000000000000000",
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "Amount Required",
          transaction: fromTransactionRaw({
            family: "stacks",
            nonce: "1",
            network: "mainnet",
            anchorMode: AnchorMode.Any,
            recipient: ACCOUNT_1,
            amount: "0",
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount",
          transaction: fromTransactionRaw({
            family: "stacks",
            nonce: "1",
            network: "mainnet",
            anchorMode: AnchorMode.Any,
            recipient: ACCOUNT_1,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
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
    stacks,
  },
};

testBridge(dataset);
