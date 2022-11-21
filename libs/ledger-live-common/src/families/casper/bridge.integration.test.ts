import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";
import BigNumber from "bignumber.js";
import {
  AmountRequired,
  InvalidAddress,
  InvalidMinimumAmount,
  NotEnoughBalance,
  CasperInvalidTransferId,
} from "@ledgerhq/errors";
import { getEstimatedFees } from "./utils";

const SEED_IDENTIFIER =
  "0202ba6dc98cbe677711a45bf028a03646f9e588996eb223fad2485e8bc391b01581";
const ACCOUNT_2 =
  "0203A17118eC0e64c4e4FdbDbEe0eA14D118C9aAf08C6c81bbB776Cae607cEB84EcB";

const casper: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "casper seed 1",
      apdus: `
      => 11010000142c000080fa010080000000800000000000000000
      <= 038c8cb0f62b4efcd0c7868c2e749dda649affe30ff0f95fc91ce48ea67f077d1630323033384338636230663632623445466344304337383638633265373439446461363439614646453330664630663935666339314345343845413637463037374431369000
      => 11010000142c000080fa010080000000800000000001000000
      <= 02ba6dc98cbe677711a45bf028a03646f9e588996eb223fad2485e8bc391b0158130323032624136444339386362453637373731316134356266303238413033363436463965353838393936654232323366616432343835653862633339316230313538319000
      => 11010000142c000080fa010080000000800000000002000000
      <= 022aab9b6ed404f8cffe76ce493e1995d195b5f141ee7d5b7fb20fce60f2a4969130323032324141423942364544343034663843464645373663653439334531393935643139354235463134314565374435423766623230464345363066324134393639319000
      => 11010000142c000080fa010080010000800000000000000000
      <= 03a5b4081bd0d6db6d4ec033bcfae8313351d89f1194e435055662fca2aa8f942930323033613542343038314244304436644236443445433033336263464145383331333335316438396631313934653433353035353636326663413261613846393432399000
      `,
    },
  ],
  accounts: [
    {
      raw: {
        id: `js:2:casper:${SEED_IDENTIFIER}:casper_wallet`,
        seedIdentifier: SEED_IDENTIFIER,
        name: "Casper 1",
        derivationMode: "casper_wallet" as const,
        index: 0,
        freshAddress: SEED_IDENTIFIER,
        freshAddressPath: "44'/506'/0'/0/1",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "casper",
        unitMagnitude: 9,
        lastSyncDate: "",
        balance: "1000",
      },
      transactions: [
        {
          name: "Not a valid address",
          transaction: fromTransactionRaw({
            family: "casper",
            recipient: "novalidaddress",
            fees: getEstimatedFees().toString(),
            amount: "1000",
            deploy: null,
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
            family: "casper",
            recipient: ACCOUNT_2,
            fees: getEstimatedFees().toString(),
            amount: (300 * 1e9).toString(),
            deploy: null,
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
            family: "casper",
            recipient: ACCOUNT_2,
            amount: "0",
            fees: getEstimatedFees().toString(),
            deploy: null,
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "Minimum Amount Required",
          transaction: fromTransactionRaw({
            family: "casper",
            fees: getEstimatedFees().toString(),
            recipient: ACCOUNT_2,
            amount: "1",
            deploy: null,
          }),

          expectedStatus: {
            errors: {
              amount: new InvalidMinimumAmount(),
            },
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount",
          transaction: fromTransactionRaw({
            family: "casper",
            recipient: ACCOUNT_2,
            amount: "3",
            deploy: null,
            fees: getEstimatedFees().toString(),
          }),
          expectedStatus: {
            amount: new BigNumber("3"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "Invalid TransferID",
          transaction: fromTransactionRaw({
            family: "casper",
            recipient: ACCOUNT_2,
            fees: getEstimatedFees().toString(),
            amount: "3",
            transferId: "afdsaf1",
            deploy: null,
          }),
          expectedStatus: {
            amount: new BigNumber("3"),
            errors: {
              sender: new CasperInvalidTransferId(),
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
    casper,
  },
};

testBridge(dataset);
