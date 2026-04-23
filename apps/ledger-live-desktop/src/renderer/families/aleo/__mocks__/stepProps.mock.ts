import BigNumber from "bignumber.js";

import type { StepProps } from "~/renderer/modals/Send/types";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { ALEO_ACCOUNT_1 } from "./account.mock";

const makeAleoAccount = (percentage = 0): AleoAccount => ({
  ...ALEO_ACCOUNT_1,
  aleoResources: {
    transparentBalance: new BigNumber(0),
    privateBalance: new BigNumber(0),
    unspentPrivateRecords: [],
    provableApi: {
      scannerStatus: { synced: false, percentage },
    },
    lastPrivateSyncDate: null,
  },
});

export const makeStepProps = (overrides: Partial<StepProps> = {}): StepProps =>
  ({
    account: makeAleoAccount(0),
    parentAccount: null,
    transitionTo: jest.fn(),
    onChangeAccount: jest.fn(),
    error: null,
    status: {
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(0),
      amount: new BigNumber(0),
      totalSpent: new BigNumber(0),
    },
    currencyName: "Aleo",
    device: null,
    bridgePending: false,
    optimisticOperation: null,
    closeModal: jest.fn(),
    openModal: jest.fn(),
    onChangeTransaction: jest.fn(),
    onTransactionError: jest.fn(),
    onOperationBroadcasted: jest.fn(),
    onRetry: jest.fn(),
    setSigned: jest.fn(),
    signed: false,
    openedFromAccount: false,
    onResetMaybeRecipient: jest.fn(),
    onResetMaybeAmount: jest.fn(),
    updateTransaction: jest.fn(),
    updateAccount: jest.fn(),
    onConfirmationHandler: jest.fn(),
    onFailHandler: jest.fn(),
    ...overrides,
  }) as StepProps;
