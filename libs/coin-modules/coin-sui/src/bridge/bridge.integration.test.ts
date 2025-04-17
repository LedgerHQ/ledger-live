import { AccountRaw, CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  InvalidAddress,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { fromTransactionRaw } from "./transaction";

const OWNER = "0x117527fdcf2f5f6e82fa499c0398def2643550d63f7e8311245d75f4635f0435";
const RECIPIENT = "0xba7080172a6d957b9ed2e3eb643529860be963cf4af896fb84f1cde00f46b561";
const DEFAULT_AMOUNT = "10";

const suiAccount1: AccountRaw = {
  id: `js:2:sui:${OWNER}:`,
  seedIdentifier: OWNER,
  name: `Sui ${OWNER}`,
  derivationMode: "sui",
  index: 1,
  freshAddress: OWNER,
  freshAddressPath: "44'/784'/1'/0'/0'",
  pendingOperations: [],
  operations: [],
  currencyId: "sui",
  balance: "100000000",
  blockHeight: 0,
  lastSyncDate: "",
};

const sui: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "sui seed 1",
      apdus: `
      => 0002000021001b7cf66fe039a16326933b3fe94627a7ddc4d18539b925bdb80f9294f88df4af
      <= 021b7cf66fe039a16326933b3fe94627a7ddc4d18539b925bdb80f9294f88df4af9000
      => 000200003a010000000000000000000000000000000000000000000000000000000000000000062c0000801003008000000080000000800000008000000080
      <= 0120e5fb8c817b97e9e9aec677b9e822e8a60c7471624f36b701c94560b88195a8e720eba97be74a8e66a2a423d18d4d73b6866503c406b376fb49f6bf0aacb6d508279000
      => 0002000021007cfea3aa1e07cc4b500c237a8bf8dcb31d5cb855f29dfdeb92f9e4df9493a6cd
      <= 027cfea3aa1e07cc4b500c237a8bf8dcb31d5cb855f29dfdeb92f9e4df9493a6cd9000
      => 0002000036010000000000000000000000000000000000000000000000000000000000000000052c00008010030080000000800000008000000080
      <= 0120e95d14c7b906d66090556e0fce65ed3b71167b37e0c19136857d35b44f082ba720117527fdcf2f5f6e82fa499c0398def2643550d63f7e8311245d75f4635f04359000
        `,
    },
  ],
  accounts: [
    {
      raw: suiAccount1,
      transactions: [
        {
          name: "recipient and sender must not be the same",
          transaction: fromTransactionRaw({
            family: "sui",
            recipient: OWNER,
            amount: DEFAULT_AMOUNT,
            mode: "send",
          }),
          expectedStatus: {
            amount: new BigNumber(DEFAULT_AMOUNT),
            errors: { recipient: new InvalidAddressBecauseDestinationIsAlsoSource() },
            warnings: {},
          },
        },
        {
          name: "send tx",
          transaction: fromTransactionRaw({
            amount: "2000000",
            recipient: RECIPIENT,
            useAllAmount: false,
            family: "sui",
            mode: "send",
            fees: "0",
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
            estimatedFees: BigNumber("0"),
            amount: BigNumber("2000000"),
            totalSpent: BigNumber("2000000"),
          },
        },
        {
          name: "not enough balance",
          transaction: fromTransactionRaw({
            family: "sui",
            recipient: RECIPIENT,
            amount: "10000000000000000000",
            mode: "send",
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "recipient is required",
          transaction: fromTransactionRaw({
            family: "sui",
            recipient: "",
            amount: "1000000",
            mode: "send",
          }),
          expectedStatus: {
            errors: {
              recipient: new RecipientRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "correct recipient is required",
          transaction: fromTransactionRaw({
            family: "sui",
            recipient: "incorrect",
            amount: "1000000",
            mode: "send",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "amount is required",
          transaction: fromTransactionRaw({
            family: "sui",
            recipient: RECIPIENT,
            amount: "0",
            mode: "send",
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "negative amount is invalid",
          transaction: fromTransactionRaw({
            family: "sui",
            recipient: RECIPIENT,
            amount: "-1000000",
            mode: "send",
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "recipient with special characters",
          transaction: fromTransactionRaw({
            family: "sui",
            recipient: "0x!@#$%^&*()",
            amount: "1000000",
            mode: "send",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "amount exceeds max safe integer",
          transaction: fromTransactionRaw({
            family: "sui",
            recipient: RECIPIENT,
            amount: "9007199254740992",
            mode: "send",
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "use all amount with insufficient balance for fees",
          transaction: fromTransactionRaw({
            family: "sui",
            recipient: RECIPIENT,
            amount: "0",
            useAllAmount: true,
            mode: "send",
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "minimum amount validation",
          transaction: fromTransactionRaw({
            family: "sui",
            recipient: RECIPIENT,
            amount: "1", // Minimum amount
            mode: "send",
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
            estimatedFees: BigNumber("0"),
            amount: BigNumber("1"),
            totalSpent: BigNumber("1"),
          },
        },
        {
          name: "recipient with wrong length",
          transaction: fromTransactionRaw({
            family: "sui",
            recipient: "0x123", // Too short
            amount: "1000000",
            mode: "send",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "recipient without 0x prefix",
          transaction: fromTransactionRaw({
            family: "sui",
            recipient: "ba7080172a6d957b9ed2e3eb643529860be963cf4af896fb84f1cde00f46b561",
            amount: "10000",
            mode: "send",
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
          },
        },
        {
          name: "amount with leading zeros",
          transaction: fromTransactionRaw({
            family: "sui",
            recipient: RECIPIENT,
            amount: "0001000000",
            mode: "send",
          }),
          expectedStatus: {
            errors: {},
            warnings: {},
            estimatedFees: BigNumber("0"),
            amount: BigNumber("1000000"),
            totalSpent: BigNumber("1000000"),
          },
        },
        {
          name: "amount with scientific notation",
          transaction: fromTransactionRaw({
            family: "sui",
            recipient: RECIPIENT,
            amount: "1e6",
            mode: "send",
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
    sui,
  },
};
