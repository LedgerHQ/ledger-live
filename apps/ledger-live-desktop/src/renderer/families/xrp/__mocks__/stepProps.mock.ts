import { t } from "~/renderer/i18n/init";
import type { StepProps } from "../AddTokenModal/types";
import { XRP_ACCOUNT } from "./account.mock";
import { XRP_TOKEN } from "./currency.mock";
import { makeStatus, optIn } from "./transaction.mock";

export function makeStepProps(overrides: Partial<StepProps> = {}): StepProps {
  return {
    t,
    account: XRP_ACCOUNT,
    token: XRP_TOKEN,
    transaction: optIn,
    status: makeStatus(),
    transitionTo: jest.fn(),
    device: null,
    parentAccount: null,
    onRetry: jest.fn(),
    onClose: jest.fn(),
    optimisticOperation: undefined,
    error: undefined,
    signed: false,
    onUpdateTransaction: jest.fn(),
    onTransactionError: jest.fn(),
    onOperationBroadcasted: jest.fn(),
    setSigned: jest.fn(),
    bridgePending: false,
    action: "add",
    onChangeToken: jest.fn(),
    isRippling: false,
    onChangeRippling: jest.fn(),
    tokenAccount: undefined,
    ...overrides,
  };
}
