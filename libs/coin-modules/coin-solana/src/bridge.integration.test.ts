import BigNumber from "bignumber.js";
import {
  SolanaAccount,
  SolanaStake,
  SolanaTokenAccount,
  SolanaTokenAccountRaw,
  TokenTransferTransaction,
  Transaction,
  TransactionModel,
  TransactionStatus,
} from "./types";
import scanAccounts1 from "./datasets/solana.scanAccounts.1";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, AccountRaw, CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import {
  SolanaAccountNotFunded,
  SolanaAddressOffEd25519,
  SolanaInvalidValidator,
  SolanaMemoIsTooLong,
  SolanaRecipientAssociatedTokenAccountWillBeFunded,
  SolanaStakeAccountNotFound,
  SolanaStakeAccountRequired,
  SolanaTokenAccountFrozen,
  SolanaTokenAccountHoldsAnotherToken,
  SolanaValidatorRequired,
} from "./errors";
import { encodeAccountIdWithTokenAccountAddress, MAX_MEMO_LENGTH } from "./logic";
import createTransaction from "./createTransaction";
import { compact } from "lodash/fp";
import { SYSTEM_ACCOUNT_RENT_EXEMPT, assertUnreachable } from "./utils";
import { getEnv } from "@ledgerhq/live-env";
import { ChainAPI, LATEST_BLOCKHASH_MOCK } from "./api";
import {
  SolanaStakeAccountIsNotDelegatable,
  SolanaStakeAccountValidatorIsUnchangeable,
} from "./errors";
import getTransactionStatus from "./getTransactionStatus";
import { prepareTransaction } from "./prepareTransaction";
import { encodeAccountId } from "@ledgerhq/coin-framework/lib/account/accountId";

// do not change real properties or the test will break
const testOnChainData = {
  //  --- real props ---
  unfundedAddress: "7b6Q3ap8qRzfyvDw1Qce3fUV8C7WgFNzJQwYNTJm3KQo",
  // 0/0
  fundedSenderAddress: "AQbkEagmPgmsdAfS4X8V8UyJnXXjVPMvjeD15etqQ3Jh",
  fundedSenderBalance: new BigNumber(83389840),
  // 1000/0
  fundedAddress: "ARRKL4FT4LMwpkhUw4xNbfiHqR7UdePtzGLvkszgydqZ",
  wSolSenderAssocTokenAccAddress: "8RtwWeqdFz4EFuZU3MAadfYMWSdRMamjFrfq6BXkHuNN",
  wSolSenderAssocTokenAccBalance: new BigNumber(7960720),
  // 1000/0, mint - wrapped sol
  wSolFundedAccountAssocTokenAccAddress: "Ax69sAxqBSdT3gMAUqXb8pUvgxSLCiXfTitMALEnFZTS",
  // 0/0
  notWSolTokenAccAddress: "Hsm3S2rhX4HwxYBaCyqgJ1cCtFyFSBu6HLy1bdvh7fKs",
  validatorAddress: "9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF",
  fees: {
    stakeAccountRentExempt: 2282880,
    systemAccountRentExempt: SYSTEM_ACCOUNT_RENT_EXEMPT,
    lamportsPerSignature: 5000,
  },
  // ---  maybe outdated or not real, fine for tests ---
  offEd25519Address: "6D8GtWkKJgToM5UoiByHqjQCCC9Dq1Hh7iNmU4jKSs14",
  offEd25519Address2: "12rqwuEgBYiGhBrDJStCiqEtzQpTTiZbh7teNVLuYcFA",
};

const mainAccId = encodeAccountId({
  type: "js",
  version: "2",
  currencyId: "solana",
  xpubOrAddress: testOnChainData.fundedSenderAddress,
  derivationMode: "solanaMain",
});

const wSolSubAccId = encodeAccountIdWithTokenAccountAddress(
  mainAccId,
  testOnChainData.wSolSenderAssocTokenAccAddress,
);

const wSolToken = findTokenByAddressInCurrency(
  "So11111111111111111111111111111111111111112",
  "solana",
) as TokenCurrency;

const fees = (signatureCount: number) =>
  new BigNumber(signatureCount * testOnChainData.fees.lamportsPerSignature);

const zero = new BigNumber(0);

const solana: CurrenciesData<Transaction> = {
  scanAccounts: [scanAccounts1],
  // FIXME Ordering of validators must be always the same, for this test to be stable:
  // https://github.com/LedgerHQ/ledger-live-common/blob/develop/src/__tests__/test-helpers/bridge.ts#L171-L188
  FIXME_ignorePreloadFields: ["validators"],
  accounts: [
    {
      raw: makeAccount(testOnChainData.fundedSenderAddress),
      /*
      Solana integration is written in such a way that requires
      prepareTransaction to be called before any meaningfull status
      can be calculated. The general bridge tests do not run prepareTransaction
      on all tests, so skip them in the general runner, but make alternatives for them.
      */
      FIXME_tests: [
        "balance is sum of ops",
        "Default empty recipient have a recipientError",
        "invalid recipient have a recipientError",
        "can be called on an empty transaction",
      ],
      transactions: [
        ...recipientRequired(),
        ...recipientNotValid(),
        ...recipientIsSameAsSender(),
        ...memoIsTooLong(),
        {
          name: "status is error: called on an empty transaction",
          transaction: createTransaction({} as any),
          expectedStatus: {
            errors: {
              recipient: new RecipientRequired(),
            },
            warnings: {},
            estimatedFees: fees(1),
            amount: zero,
            totalSpent: fees(1),
          },
        },
        ...transferTests(),
        ...stakingTests(),
        ...tokenTests(),
      ],
    },
  ],
};

export const dataset: DatasetTest<Transaction> = {
  implementations: [getEnv("MOCK") ? "mock" : "js"], // FIXME we should actually put both mock and js like other dataset do
  currencies: {
    solana,
  },
};

function makeAccount(freshAddress: string): AccountRaw {
  return {
    id: mainAccId,
    seedIdentifier: "",
    derivationMode: "solanaMain" as const,
    index: 0,
    freshAddress,
    freshAddressPath: "",
    blockHeight: 0,
    operations: [],
    pendingOperations: [],
    currencyId: "solana",
    lastSyncDate: "",
    balance: "0",
    subAccounts: [makeSubTokenAccount()],
  };
}

function makeSubTokenAccount(): SolanaTokenAccountRaw {
  return {
    type: "TokenAccountRaw",
    id: wSolSubAccId,
    parentId: mainAccId,
    tokenId: wSolToken.id,
    balance: "0",
    operations: [],
    pendingOperations: [],
  };
}

type TransactionTestSpec = Exclude<
  Exclude<
    DatasetTest<Transaction>["currencies"][string]["accounts"],
    undefined
  >[number]["transactions"],
  undefined
>[number];

function recipientRequired(): TransactionTestSpec[] {
  const models: TransactionModel[] = [
    {
      kind: "token.transfer",
      uiState: {
        subAccountId: wSolSubAccId,
      },
    },
    {
      kind: "transfer",
      uiState: {},
    },
  ];
  return models.map(model => {
    return {
      name: `${model.kind} :: status is error: recipient required`,
      transaction: {
        model,
        amount: zero,
        recipient: "",
        family: "solana",
      },
      expectedStatus: {
        errors: {
          recipient: new RecipientRequired(),
        },
        warnings: {},
        estimatedFees: fees(1),
        amount: zero,
        totalSpent: model.kind === "transfer" ? fees(1) : zero,
      },
    };
  });
}

function recipientNotValid(): TransactionTestSpec[] {
  return recipientRequired().map(spec => {
    return {
      ...spec,
      transaction: {
        ...(spec.transaction as Transaction),
        recipient: "invalid address",
      },
      expectedStatus: {
        ...spec.expectedStatus,
        errors: {
          recipient: new InvalidAddress(),
        },
      },
    };
  });
}

function recipientIsSameAsSender(): TransactionTestSpec[] {
  return recipientRequired().map(spec => {
    return {
      ...spec,
      transaction: {
        ...(spec.transaction as Transaction),
        recipient: testOnChainData.fundedSenderAddress,
      },
      expectedStatus: {
        ...spec.expectedStatus,
        errors: {
          recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
        },
      },
    };
  });
}

function memoIsTooLong(): TransactionTestSpec[] {
  return compact(
    recipientRequired().map(spec => {
      const tx = spec.transaction as Transaction;
      switch (tx.model.kind) {
        case "transfer":
        case "token.transfer":
          tx.model.uiState.memo = "c".repeat(MAX_MEMO_LENGTH + 1);
          return {
            ...spec,
            transaction: {
              ...(spec.transaction as Transaction),
              recipient: testOnChainData.fundedAddress,
            },
            expectedStatus: {
              ...spec.expectedStatus,
              errors: {
                memo: new SolanaMemoIsTooLong(),
              },
            },
          };
        case "token.createATA":
        case "stake.createAccount":
        case "stake.delegate":
        case "stake.undelegate":
        case "stake.withdraw":
        case "stake.split":
          return undefined;
        default:
          return assertUnreachable(tx.model);
      }
    }),
  );
}

function transferTests(): TransactionTestSpec[] {
  return [
    {
      name: "transfer :: status is success: not all amount",
      transaction: {
        model: {
          kind: "transfer",
          uiState: {},
        },
        amount: testOnChainData.fundedSenderBalance.dividedBy(2),
        recipient: testOnChainData.fundedAddress,
        family: "solana",
      },
      expectedStatus: {
        errors: {},
        warnings: {},
        estimatedFees: fees(1),
        amount: testOnChainData.fundedSenderBalance.dividedBy(2),
        totalSpent: testOnChainData.fundedSenderBalance.dividedBy(2).plus(fees(1)),
      },
    },
    {
      name: "transfer :: status is success: all amount",
      transaction: {
        model: {
          kind: "transfer",
          uiState: {},
        },
        useAllAmount: true,
        amount: zero,
        recipient: testOnChainData.fundedAddress,
        family: "solana",
      },
      expectedStatus: {
        errors: {},
        warnings: {},
        estimatedFees: fees(1),
        amount: testOnChainData.fundedSenderBalance
          .minus(fees(1))
          .minus(testOnChainData.fees.systemAccountRentExempt),
        totalSpent: testOnChainData.fundedSenderBalance.minus(
          testOnChainData.fees.systemAccountRentExempt,
        ),
      },
    },
    {
      name: "transfer :: status is error: not enough balance, not all amount",
      transaction: {
        model: {
          kind: "transfer",
          uiState: {},
        },
        amount: testOnChainData.fundedSenderBalance,
        recipient: testOnChainData.fundedAddress,
        family: "solana",
      },
      expectedStatus: {
        errors: {
          amount: new NotEnoughBalance(),
        },
        warnings: {},
        estimatedFees: fees(1),
        amount: testOnChainData.fundedSenderBalance,
        totalSpent: testOnChainData.fundedSenderBalance.plus(fees(1)),
      },
    },
    {
      name: "transfer :: status is error: amount is 0",
      transaction: {
        model: {
          kind: "transfer",
          uiState: {},
        },
        amount: zero,
        recipient: testOnChainData.fundedAddress,
        family: "solana",
      },
      expectedStatus: {
        errors: {
          amount: new AmountRequired(),
        },
        warnings: {},
        estimatedFees: fees(1),
        amount: zero,
        totalSpent: fees(1),
      },
    },
    {
      name: "transfer :: status is error: amount is negative",
      transaction: {
        model: {
          kind: "transfer",
          uiState: {},
        },
        amount: new BigNumber(-1),
        recipient: testOnChainData.fundedAddress,
        family: "solana",
      },
      expectedStatus: {
        errors: {
          amount: new AmountRequired(),
        },
        warnings: {},
        estimatedFees: fees(1),
        amount: new BigNumber(-1),
        totalSpent: zero,
      },
    },
    {
      name: "transfer :: status is warning: recipient wallet not funded",
      transaction: {
        model: {
          kind: "transfer",
          uiState: {},
        },
        amount: new BigNumber(1),
        recipient: testOnChainData.unfundedAddress,
        family: "solana",
      },
      expectedStatus: {
        errors: {},
        warnings: {
          recipient: new SolanaAccountNotFunded(),
        },
        estimatedFees: fees(1),
        amount: new BigNumber(1),
        totalSpent: fees(1).plus(1),
      },
    },
    {
      name: "transfer :: status is warning: recipient address is off ed25519",
      transaction: {
        model: {
          kind: "transfer",
          uiState: {},
        },
        amount: new BigNumber(1),
        recipient: testOnChainData.offEd25519Address,
        family: "solana",
      },
      expectedStatus: {
        errors: {},
        warnings: {
          recipient: new SolanaAccountNotFunded(),
          recipientOffCurve: new SolanaAddressOffEd25519(),
        },
        estimatedFees: fees(1),
        amount: new BigNumber(1),
        totalSpent: fees(1).plus(1),
      },
    },
  ];
}

function tokenTests(): TransactionTestSpec[] {
  return [
    {
      name: "token.transfer :: status is success: recipient is funded wallet, assoc token acc exists",
      transaction: {
        model: {
          kind: "token.transfer",
          uiState: {
            subAccountId: wSolSubAccId,
          },
        },
        amount: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
        recipient: testOnChainData.fundedAddress,
        family: "solana",
      },
      expectedStatus: {
        errors: {},
        warnings: {},
        estimatedFees: fees(1),
        amount: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
        totalSpent: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
      },
    },
    {
      name: "token.transfer :: status is success: recipient is correct mint token acc",
      transaction: {
        model: {
          kind: "token.transfer",
          uiState: {
            subAccountId: wSolSubAccId,
          },
        },
        amount: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
        recipient: testOnChainData.wSolFundedAccountAssocTokenAccAddress,
        family: "solana",
      },
      expectedStatus: {
        errors: {},
        warnings: {},
        estimatedFees: fees(1),
        amount: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
        totalSpent: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
      },
    },
    {
      name: "token.transfer :: status is error: recipient is another mint token acc",
      transaction: {
        model: {
          kind: "token.transfer",
          uiState: {
            subAccountId: wSolSubAccId,
          },
        },
        amount: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
        recipient: testOnChainData.notWSolTokenAccAddress,
        family: "solana",
      },
      expectedStatus: {
        errors: {
          recipient: new SolanaTokenAccountHoldsAnotherToken(),
        },
        warnings: {},
        estimatedFees: fees(1),
        amount: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
        totalSpent: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
      },
    },
    {
      name: "token.transfer :: status is warning: recipient is off curve",
      transaction: {
        model: {
          kind: "token.transfer",
          uiState: {
            subAccountId: wSolSubAccId,
          },
        },
        amount: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
        recipient: testOnChainData.offEd25519Address,
        family: "solana",
      },
      expectedStatus: {
        errors: {
          recipient: new SolanaAddressOffEd25519(),
        },
        warnings: {},
        estimatedFees: fees(1),
        amount: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
        totalSpent: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
      },
    },
    {
      name: "token.transfer :: status is success: recipient is wallet and no assoc token acc exists (will be created)",
      transaction: {
        model: {
          kind: "token.transfer",
          uiState: {
            subAccountId: wSolSubAccId,
          },
        },
        amount: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
        recipient: testOnChainData.unfundedAddress,
        family: "solana",
      },
      expectedStatus: {
        errors: {},
        warnings: {
          recipient: new SolanaRecipientAssociatedTokenAccountWillBeFunded(),
        },
        // this fee is dynamic, skip
        //estimatedFees: new BigNumber(2044280),
        amount: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
        totalSpent: testOnChainData.wSolSenderAssocTokenAccBalance.dividedBy(2),
      },
    },
  ];
}

function stakingTests(): TransactionTestSpec[] {
  return [
    {
      name: "stake.createAccount :: status is error: amount is negative",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.createAccount",
          uiState: {
            delegate: { voteAccAddress: testOnChainData.validatorAddress },
          },
        },
        recipient: "",
        amount: new BigNumber(-1),
      },
      expectedStatus: {
        amount: new BigNumber(-1),
        estimatedFees: fees(1).plus(testOnChainData.fees.stakeAccountRentExempt),
        totalSpent: zero,
        errors: {
          amount: new AmountRequired(),
        },
      },
    },
    {
      name: "stake.createAccount :: status is error: amount is zero",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.createAccount",
          uiState: {
            delegate: { voteAccAddress: testOnChainData.validatorAddress },
          },
        },
        recipient: "",
        amount: zero,
      },
      expectedStatus: {
        amount: zero,
        estimatedFees: fees(1).plus(testOnChainData.fees.stakeAccountRentExempt),
        totalSpent: fees(1).plus(testOnChainData.fees.stakeAccountRentExempt),
        errors: {
          amount: new AmountRequired(),
        },
      },
    },
    {
      name: "stake.createAccount :: status is error: not enough balance, not all amount",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.createAccount",
          uiState: {
            delegate: { voteAccAddress: testOnChainData.validatorAddress },
          },
        },
        recipient: "",
        amount: testOnChainData.fundedSenderBalance,
      },
      expectedStatus: {
        amount: testOnChainData.fundedSenderBalance,
        estimatedFees: fees(1).plus(testOnChainData.fees.stakeAccountRentExempt),
        totalSpent: fees(1)
          .plus(testOnChainData.fees.stakeAccountRentExempt)
          .plus(testOnChainData.fundedSenderBalance),
        errors: {
          amount: new NotEnoughBalance(),
        },
      },
    },
    {
      name: "stake.createAccount :: status is error: validator required",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.createAccount",
          uiState: {
            delegate: { voteAccAddress: "" },
          },
        },
        recipient: "",
        amount: new BigNumber(1),
      },
      expectedStatus: {
        amount: new BigNumber(1),
        estimatedFees: fees(1).plus(testOnChainData.fees.stakeAccountRentExempt),
        totalSpent: fees(1).plus(testOnChainData.fees.stakeAccountRentExempt).plus(1),
        errors: {
          voteAccAddr: new SolanaValidatorRequired(),
        },
      },
    },
    {
      name: "stake.createAccount :: status is error: validator has invalid address",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.createAccount",
          uiState: {
            delegate: { voteAccAddress: "invalid address" },
          },
        },
        recipient: "",
        amount: new BigNumber(1),
      },
      expectedStatus: {
        amount: new BigNumber(1),
        estimatedFees: fees(1).plus(testOnChainData.fees.stakeAccountRentExempt),
        totalSpent: fees(1).plus(testOnChainData.fees.stakeAccountRentExempt).plus(1),
        errors: {
          voteAccAddr: new InvalidAddress(),
        },
      },
    },
    {
      name: "stake.createAccount :: status is error: validator invalid",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.createAccount",
          uiState: {
            delegate: { voteAccAddress: testOnChainData.fundedSenderAddress },
          },
        },
        recipient: "",
        amount: new BigNumber(1),
      },
      expectedStatus: {
        amount: new BigNumber(1),
        estimatedFees: fees(1).plus(testOnChainData.fees.stakeAccountRentExempt),
        totalSpent: fees(1).plus(testOnChainData.fees.stakeAccountRentExempt).plus(1),
        errors: {
          voteAccAddr: new SolanaInvalidValidator(),
        },
      },
    },
    {
      name: "stake.createAccount :: status is success, not all amount",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.createAccount",
          uiState: {
            delegate: { voteAccAddress: testOnChainData.validatorAddress },
          },
        },
        recipient: "",
        amount: new BigNumber(1),
      },
      expectedStatus: {
        amount: new BigNumber(1),
        estimatedFees: fees(1).plus(testOnChainData.fees.stakeAccountRentExempt),
        totalSpent: fees(1).plus(testOnChainData.fees.stakeAccountRentExempt).plus(1),
        errors: {},
      },
    },
    {
      name: "stake.createAccount :: status is success, all amount",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.createAccount",
          uiState: {
            delegate: { voteAccAddress: testOnChainData.validatorAddress },
          },
        },
        recipient: "",
        useAllAmount: true,
        amount: zero,
      },
      expectedStatus: {
        amount: testOnChainData.fundedSenderBalance
          .minus(fees(1)) // transaction fee
          .minus(fees(1).multipliedBy(2)) // undelegate + withdraw fees reserve
          .minus(testOnChainData.fees.stakeAccountRentExempt)
          .minus(testOnChainData.fees.systemAccountRentExempt),
        estimatedFees: fees(1).plus(testOnChainData.fees.stakeAccountRentExempt),
        totalSpent: testOnChainData.fundedSenderBalance
          .minus(testOnChainData.fees.systemAccountRentExempt)
          .minus(fees(1).multipliedBy(2)), // undelegate + withdraw fees reserve,
        errors: {},
      },
    },
    {
      name: "stake.delegate :: status is error: stake account address and validator address required",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.delegate",
          uiState: {
            stakeAccAddr: "",
            voteAccAddr: "",
          },
        },
        recipient: "",
        amount: zero,
      },
      expectedStatus: {
        amount: zero,
        estimatedFees: fees(1),
        totalSpent: fees(1),
        errors: {
          stakeAccAddr: new SolanaStakeAccountRequired(),
          voteAccAddr: new SolanaValidatorRequired(),
        },
      },
    },
    {
      name: "stake.delegate :: status is error: stake account address and validator address are invalid",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.delegate",
          uiState: {
            stakeAccAddr: "invalid address",
            voteAccAddr: "invalid address",
          },
        },
        recipient: "",
        amount: zero,
      },
      expectedStatus: {
        amount: zero,
        estimatedFees: fees(1),
        totalSpent: fees(1),
        errors: {
          stakeAccAddr: new InvalidAddress(),
          voteAccAddr: new InvalidAddress(),
        },
      },
    },
    {
      name: "stake.delegate :: status is error: stake account not found",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.delegate",
          uiState: {
            stakeAccAddr: testOnChainData.unfundedAddress,
            voteAccAddr: testOnChainData.validatorAddress,
          },
        },
        recipient: "",
        amount: zero,
      },
      expectedStatus: {
        amount: zero,
        estimatedFees: fees(1),
        totalSpent: fees(1),
        errors: {
          stakeAccAddr: new SolanaStakeAccountNotFound(),
        },
      },
    },
    {
      name: "stake.undelegate :: status is error: stake account required",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.undelegate",
          uiState: {
            stakeAccAddr: "",
          },
        },
        recipient: "",
        amount: zero,
      },
      expectedStatus: {
        amount: zero,
        estimatedFees: fees(1),
        totalSpent: fees(1),
        errors: {
          stakeAccAddr: new SolanaStakeAccountRequired(),
        },
      },
    },
    {
      name: "stake.undelegate :: status is error: stake account invalid",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.undelegate",
          uiState: {
            stakeAccAddr: "invalid address",
          },
        },
        recipient: "",
        amount: zero,
      },
      expectedStatus: {
        amount: zero,
        estimatedFees: fees(1),
        totalSpent: fees(1),
        errors: {
          stakeAccAddr: new InvalidAddress(),
        },
      },
    },
    {
      name: "stake.undelegate :: status is error: stake account not found",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.undelegate",
          uiState: {
            stakeAccAddr: testOnChainData.unfundedAddress,
          },
        },
        recipient: "",
        amount: zero,
      },
      expectedStatus: {
        amount: zero,
        estimatedFees: fees(1),
        totalSpent: fees(1),
        errors: {
          stakeAccAddr: new SolanaStakeAccountNotFound(),
        },
      },
    },
    {
      name: "stake.withdraw :: status is error: stake account required",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.withdraw",
          uiState: {
            stakeAccAddr: "",
          },
        },
        recipient: "",
        amount: zero,
      },
      expectedStatus: {
        amount: zero,
        estimatedFees: fees(1),
        totalSpent: fees(1),
        errors: {
          stakeAccAddr: new SolanaStakeAccountRequired(),
        },
      },
    },
    {
      name: "stake.withdraw :: status is error: stake account address invalid",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.withdraw",
          uiState: {
            stakeAccAddr: "invalid address",
          },
        },
        recipient: "",
        amount: zero,
      },
      expectedStatus: {
        amount: zero,
        estimatedFees: fees(1),
        totalSpent: fees(1),
        errors: {
          stakeAccAddr: new InvalidAddress(),
        },
      },
    },
    {
      name: "stake.withdraw :: status is error: stake account not found",
      transaction: {
        family: "solana",
        model: {
          kind: "stake.withdraw",
          uiState: {
            stakeAccAddr: testOnChainData.unfundedAddress,
          },
        },
        recipient: "",
        amount: zero,
      },
      expectedStatus: {
        amount: zero,
        estimatedFees: fees(1),
        totalSpent: fees(1),
        errors: {
          stakeAccAddr: new SolanaStakeAccountNotFound(),
        },
      },
    },
  ];
}

const baseAccount = {
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
} as Account;

const baseTx = {
  family: "solana",
  recipient: "",
  amount: new BigNumber(0),
} as Transaction;

const baseAPI = {
  getLatestBlockhash: () => Promise.resolve(LATEST_BLOCKHASH_MOCK),
  getFeeForMessage: (_msg: unknown) => Promise.resolve(testOnChainData.fees.lamportsPerSignature),
  getRecentPrioritizationFees: (_: string[]) => {
    return Promise.resolve([
      {
        slot: 122422797,
        prioritizationFee: 0,
      },
      {
        slot: 122422797,
        prioritizationFee: 0,
      },
    ]);
  },
  getSimulationComputeUnits: (_ixs: any[], _payer: any) => Promise.resolve(1000),
} as ChainAPI;

type StakeTestSpec = {
  activationState: SolanaStake["activation"]["state"];
  txModel: Transaction["model"];
  expectedErrors: Record<string, Error>;
};

/**
 * Some business logic can not be described in terms of transactions and expected status
 * in the test datasets, like stake activation/deactivation, because stake activation is
 * not determenistic and changes with time. Hence the tests here to mock data
 * to be determenistic.
 */

describe("solana staking", () => {
  test("stake.delegate :: status is error: stake account is not delegatable", async () => {
    const stakeDelegateModel: Transaction["model"] & {
      kind: "stake.delegate";
    } = {
      kind: "stake.delegate",
      uiState: {
        stakeAccAddr: testOnChainData.unfundedAddress,
        voteAccAddr: testOnChainData.validatorAddress,
      },
    };

    const stakeTests: StakeTestSpec[] = [
      {
        activationState: "activating",
        txModel: stakeDelegateModel,
        expectedErrors: {
          fee: new NotEnoughBalance(),
          stakeAccAddr: new SolanaStakeAccountIsNotDelegatable(),
        },
      },
      {
        activationState: "active",
        txModel: stakeDelegateModel,
        expectedErrors: {
          fee: new NotEnoughBalance(),
          stakeAccAddr: new SolanaStakeAccountIsNotDelegatable(),
        },
      },
      {
        activationState: "deactivating",
        txModel: {
          ...stakeDelegateModel,
          uiState: {
            ...stakeDelegateModel.uiState,
            voteAccAddr: testOnChainData.unfundedAddress,
          },
        },
        expectedErrors: {
          fee: new NotEnoughBalance(),
          stakeAccAddr: new SolanaStakeAccountValidatorIsUnchangeable(),
        },
      },
    ];

    for (const stakeTest of stakeTests) {
      await runStakeTest(stakeTest);
    }
  });
});

async function runStakeTest(stakeTestSpec: StakeTestSpec) {
  const api = {
    ...baseAPI,
    getMinimumBalanceForRentExemption: () =>
      Promise.resolve(testOnChainData.fees.stakeAccountRentExempt),
    getAccountInfo: () => {
      return Promise.resolve({ data: mockedVoteAccount } as any);
    },
  } as ChainAPI;

  const account: SolanaAccount = {
    ...baseAccount,
    freshAddress: testOnChainData.fundedSenderAddress,
    solanaResources: {
      stakes: [
        {
          stakeAccAddr: testOnChainData.unfundedAddress,
          delegation: {
            stake: 1,
            voteAccAddr: testOnChainData.validatorAddress,
          },
          activation: {
            state: stakeTestSpec.activationState,
          },
        } as SolanaStake,
      ],
      unstakeReserve: BigNumber(0),
    },
  };

  const tx: Transaction = {
    ...baseTx,
    model: stakeTestSpec.txModel,
  };

  const preparedTx = await prepareTransaction(account, tx, api);
  const status = await getTransactionStatus(account, preparedTx);

  const expectedStatus: TransactionStatus = {
    amount: new BigNumber(0),
    estimatedFees: new BigNumber(testOnChainData.fees.lamportsPerSignature),
    totalSpent: new BigNumber(testOnChainData.fees.lamportsPerSignature),
    errors: stakeTestSpec.expectedErrors,
    warnings: {},
  };

  expect(status).toEqual(expectedStatus);
}

const mockedVoteAccount = {
  parsed: {
    info: {
      authorizedVoters: [
        {
          authorizedVoter: "EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4",
          epoch: 283,
        },
      ],
      authorizedWithdrawer: "EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4",
      commission: 7,
      epochCredits: [
        {
          credits: "98854605",
          epoch: 283,
          previousCredits: "98728105",
        },
      ],
      lastTimestamp: { slot: 122422797, timestamp: 1645796249 },
      nodePubkey: "EvnRmnMrd69kFdbLMxWkTn1icZ7DCceRhvmb2SJXqDo4",
      priorVoters: [],
      rootSlot: 122422766,
      votes: [{ confirmationCount: 1, slot: 122422797 }],
    },
    type: "vote",
  },
  program: "vote",
  space: 3731,
};

describe("solana tokens", () => {
  const baseAtaMock = {
    parsed: {
      info: {
        isNative: false,
        mint: wSolToken.contractAddress,
        owner: testOnChainData.fundedSenderAddress,
        state: "initialized",
        tokenAmount: {
          amount: "10000000",
          decimals: wSolToken.units[0].magnitude,
          uiAmount: 10.0,
          uiAmountString: "10",
        },
      },
      type: "account",
    },
    program: "spl-token",
    space: 165,
  };
  const frozenAtaMock = {
    ...baseAtaMock,
    parsed: {
      ...baseAtaMock.parsed,
      info: {
        ...baseAtaMock.parsed.info,
        state: "frozen",
      },
    },
  };

  const mockedTokenAcc: SolanaTokenAccount = {
    type: "TokenAccount",
    id: wSolSubAccId,
    parentId: mainAccId,
    token: wSolToken,
    balance: new BigNumber(100),
    operations: [],
    pendingOperations: [],
    spendableBalance: new BigNumber(100),
    state: "initialized",
    creationDate: new Date(),
    operationsCount: 0,
    balanceHistoryCache: {
      HOUR: { balances: [], latestDate: null },
      DAY: { balances: [], latestDate: null },
      WEEK: { balances: [], latestDate: null },
    },
    swapHistory: [],
  };
  test("token.transfer :: status is error: sender ATA is frozen", async () => {
    const txModel: TokenTransferTransaction = {
      kind: "token.transfer",
      uiState: {
        subAccountId: wSolSubAccId,
      },
    };

    const api = {
      ...baseAPI,
      getAccountInfo: () => Promise.resolve({ data: baseAtaMock } as any),
      getBalance: () => Promise.resolve(10),
    } as ChainAPI;

    const tokenAcc: SolanaTokenAccount = {
      ...mockedTokenAcc,
      state: "frozen",
    };
    const account: SolanaAccount = {
      ...baseAccount,
      freshAddress: testOnChainData.fundedSenderAddress,
      subAccounts: [tokenAcc],
      solanaResources: { stakes: [], unstakeReserve: BigNumber(0) },
    };

    const tx: Transaction = {
      model: txModel,
      amount: new BigNumber(10),
      recipient: testOnChainData.fundedAddress,
      family: "solana",
    };

    const preparedTx = await prepareTransaction(account, tx, api);
    const receivedTxStatus = await getTransactionStatus(account, preparedTx);
    const expectedTxStatus: TransactionStatus = {
      amount: new BigNumber(10),
      estimatedFees: new BigNumber(testOnChainData.fees.lamportsPerSignature),
      totalSpent: new BigNumber(10),
      errors: {
        amount: new SolanaTokenAccountFrozen(),
      },
      warnings: {},
    };

    expect(receivedTxStatus).toEqual(expectedTxStatus);
  });

  test("token.transfer :: status is error: recipient ATA is frozen", async () => {
    const txModel: TokenTransferTransaction = {
      kind: "token.transfer",
      uiState: {
        subAccountId: wSolSubAccId,
      },
    };

    const api = {
      ...baseAPI,
      getAccountInfo: () => Promise.resolve({ data: frozenAtaMock } as any),
      getBalance: () => Promise.resolve(10),
    } as ChainAPI;

    const tokenAcc: SolanaTokenAccount = {
      ...mockedTokenAcc,
    };
    const account: SolanaAccount = {
      ...baseAccount,
      freshAddress: testOnChainData.fundedSenderAddress,
      subAccounts: [tokenAcc],
      solanaResources: { stakes: [], unstakeReserve: BigNumber(0) },
    };

    const tx: Transaction = {
      model: txModel,
      amount: new BigNumber(10),
      recipient: testOnChainData.fundedAddress,
      family: "solana",
    };

    const preparedTx = await prepareTransaction(account, tx, api);
    const receivedTxStatus = await getTransactionStatus(account, preparedTx);
    const expectedTxStatus: TransactionStatus = {
      amount: new BigNumber(10),
      estimatedFees: new BigNumber(testOnChainData.fees.lamportsPerSignature),
      totalSpent: new BigNumber(10),
      errors: {
        recipient: new SolanaTokenAccountFrozen(),
      },
      warnings: {},
    };

    expect(receivedTxStatus).toEqual(expectedTxStatus);
  });
});

describe("Solana bridge", () => {
  test.todo(
    "This is an empty test to make jest command pass. Remove it once there is a real test.",
  );
});
