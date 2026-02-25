import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
} from "@ledgerhq/errors";
import { AccountRaw, CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { fromTransactionRaw } from "../bridge/transaction";
import { Transaction } from "../types";

const OWNER = "0xba7080172a6d957b9ed2e3eb643529860be963cf4af896fb84f1cde00f46b561";
const RECIPIENT = "0x117527fdcf2f5f6e82fa499c0398def2643550d63f7e8311245d75f4635f0435";
const DEFAULT_AMOUNT = "10";

const suiAccount1: AccountRaw = {
  id: `js:2:sui:${OWNER}:`,
  seedIdentifier: OWNER,
  name: `Sui ${OWNER}`,
  derivationMode: "",
  index: 0,
  freshAddress: OWNER,
  freshAddressPath: "44'/784'/0'/0'/0'",
  pendingOperations: [],
  operations: [],
  currencyId: "sui",
  balance: "0",
  blockHeight: 0,
  lastSyncDate: "",
  xpub: "",
};

const sui: CurrenciesData<Transaction> = {
  FIXME_ignorePreloadFields: ["tokens"],
  FIXME_ignoreAccountFields: ["syncHash"],
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
                => 000200002100c9bf8a5402439450fbf5c9a819b69c7e8c164aef2dc7a337929ecfbb7b8f00ff
                <= 02c9bf8a5402439450fbf5c9a819b69c7e8c164aef2dc7a337929ecfbb7b8f00ff9000
                => 0002000036010000000000000000000000000000000000000000000000000000000000000000052c00008010030080010000800000008000000080
                <= 0120e0eee36ff838a4df06ebcfdc31fab96a134c71b29ee763e2c72aebe427338c9a20ba7080172a6d957b9ed2e3eb643529860be963cf4af896fb84f1cde00f46b5619000
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
            coinType: "0x2::sui::SUI",
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
            coinType: "0x2::sui::SUI",
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
            coinType: "0x2::sui::SUI",
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
            coinType: "0x2::sui::SUI",
          }),
          expectedStatus: {
            errors: {
              recipient: new RecipientRequired(),
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
            coinType: "0x2::sui::SUI",
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
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
