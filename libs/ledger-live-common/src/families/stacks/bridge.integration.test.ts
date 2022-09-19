import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import { AnchorMode } from "@stacks/transactions/dist";

import type { DatasetTest } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { CurrenciesData } from "@ledgerhq/types-live";

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
      <= 022a460decc9dba8c452927fecb33d7ae25a8d79dc5442b84feaf8f3aa0e2b575d5350334b5337564d59325a4e45365342383850485234534b524b324545504853384e384d43434252399000
      => 09010016142c0000807d160080000000800000000001000000
      <= 03a2d4bbb54c2f44c3a205b15ca7d2049a2bb66e50e100304f932b3b99ed3a99cb5350324136463652374632395a3338533259434a4d37484a44564532345332564757543542545a50419000
      => 09010016142c0000807d160080010000800000000000000000
      <= 034bbb21911e9d4502ac170162c5c05cbba65cbb79e5b46adf95152af2d0e78a4553503244563252565a503141363951365641473550484551365a4851485a5043563834544d594e474e9000
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
