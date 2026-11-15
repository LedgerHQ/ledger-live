import BigNumber from "bignumber.js";
import type { TFunction } from "i18next";
import type { StepProps } from "../AddTokenModal/types";
import { XRP_ACCOUNT } from "./account.mock";
import { xrpIouToken } from "./currency.mock";

export const makeStepProps = (overrides: Partial<StepProps> = {}): StepProps => ({
  t: jest.fn((key: string) => key) as unknown as TFunction,
  transitionTo: jest.fn(),
  device: null,
  account: XRP_ACCOUNT,
  parentAccount: null,
  onRetry: jest.fn(),
  onClose: jest.fn(),
  optimisticOperation: undefined,
  error: undefined,
  signed: false,
  transaction: null,
  status: {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber(0),
    amount: new BigNumber(0),
    totalSpent: new BigNumber(0),
  },
  onUpdateTransaction: jest.fn(),
  onTransactionError: jest.fn(),
  onOperationBroadcasted: jest.fn(),
  setSigned: jest.fn(),
  bridgePending: false,
  action: "add",
  token: xrpIouToken,
  onChangeToken: jest.fn(),
  maxLimit: null,
  isRippling: false,
  onChangeRippling: jest.fn(),
  tokenAccount: undefined,
  ...overrides,
});
