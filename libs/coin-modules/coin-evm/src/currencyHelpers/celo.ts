import { OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  CeloPendingWithdrawal,
  CeloVote,
  EtherscanOperation,
  EvmAccount,
  LedgerExplorerOperation,
} from "../types";

export const availablePendingWithdrawals = (account: EvmAccount): CeloPendingWithdrawal[] => {
  const { pendingWithdrawals } = account.evmResources || {};

  return (pendingWithdrawals || []).filter(
    withdrawal => new Date(withdrawal.time.toNumber() * 1000) < new Date(),
  );
};

export const activatableVotes = (account: EvmAccount): CeloVote[] => {
  const { votes } = account.evmResources || {};

  return (votes || []).filter(vote => vote.activatable);
};

export const isAccountRegistrationPending = (account: EvmAccount): boolean => {
  const isAccountRegistrationPending =
    account.pendingOperations.some(op => op.type === "REGISTER") &&
    !account.evmResources?.registrationStatus;

  return isAccountRegistrationPending;
};

export const withdrawableBalance = (account: EvmAccount): BigNumber =>
  availablePendingWithdrawals(account).reduce(
    (sum, withdrawal) => sum.plus(withdrawal.value),
    new BigNumber(0),
  );

export const getCeloOperationType = (
  rawOperation: EtherscanOperation | LedgerExplorerOperation,
): OperationType => {
  if (!rawOperation.input || ("methodId" in rawOperation && !rawOperation.methodId)) {
    return "OUT";
  }

  const celoTypes: Record<string, OperationType> = {
    "0xf83d08ba": "LOCK",
    "0x6198e339": "UNLOCK",
    "0x2e1a7d4d": "WITHDRAW",
    "0x580d747a": "VOTE",
    "0x6e198475": "REVOKE", // revokeActive
    "0xe0a2ab52": "REVOKE", // revokeAllActive
    "0x9dfb6081": "REVOKE", // revokePending
    "0xc14470c4": "ACTIVATE", // activateForAccount
    "0x1c5a9d9c": "ACTIVATE", // activate
    "0x9dca362f": "REGISTER", // createAccount
  };

  const selector =
    "methodId" in rawOperation
      ? rawOperation.methodId.toLowerCase()
      : rawOperation.input.slice(0, 10).toLowerCase();

  return celoTypes[selector] || "OUT";
};
