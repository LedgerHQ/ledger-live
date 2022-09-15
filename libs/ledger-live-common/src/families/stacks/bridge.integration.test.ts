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

const SEED_IDENTIFIER = "SP1QM16S93TEMM1Q9QHB8WV1EEEC3Z2Y3P0AE287S";
const ACCOUNT_1 = "SP18S8PQ2JKPW8Z4TNB2C3WJ5FN5FJHZ41Q79NYVE";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const stacks: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: [],
  scanAccounts: [
    {
      name: "stacks seed 1",
      apdus: `
      => 09010016142c0000807d160080000000800000000000000000
      <= 030de1af559d4533669be6fb2a8585728a627a198de47e555d511b4f3c4038a154535031514d313653393354454d4d3151395148423857563145454543335a32593350304145323837539000
      => 09010016142c0000807d160080000000800000000001000000
      <= 03e6612b0454fbb96934435e05975ed1910abfb5f106f4b13acd7326b47c66b27d535032303657385036463630365250464e4e463054534330434241564b46324a48364d354b383759489000
      => 09010016142c0000807d160080000000800000000002000000
      <= 021867b0c34594d7738c9577a195f0c04fcfaed14d029bab1eb18aefa09aeda64a535032434d5338365930385859413443393745573358305743424a3934563351344e5856353542504b9000
      => 09010016142c0000807d160080000000800000000003000000
      <= 03671e613e598d6bdfad32ff424465a9c501cc749da20af215aae2bf7f7b64140e53503142363937574d52423338484b4431424542503333484748385a57564a325933375258453553309000
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
        derivationMode: "stacks",
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
