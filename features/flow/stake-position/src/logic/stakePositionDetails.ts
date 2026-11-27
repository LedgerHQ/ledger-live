import type { EarnPosition } from "@domain/entity-earn-position";
import type { StakePositionDetailsProps } from "../components/StakePositionDetails/StakePositionDetails.types";
import type {
  ReadyStakePositionData,
  StakePositionChainExit,
  StakePositionFormatter,
  StakePositionRate,
  StakePositionState,
} from "../types";
import { middleEllipsis } from "./display";
import { isStatusConsistent } from "./positionRules";
import {
  APY_ROW_STATES,
  EARN_MORE_STATES,
  EXIT_WAITS_FOR_POLLING,
  SHOWS_INITIAL_DEPOSIT,
  SHOWS_ZERO_RATE,
  STALE_SHOWS_UPDATING,
  selectNotice,
} from "./productRules";

/** What the details show of a position; the app adds the account, the ticker and the handlers. */
export type StakePositionDetailsData = Pick<
  StakePositionDetailsProps,
  | "status"
  | "totalRewards"
  | "rewardsHeadline"
  | "currentBalance"
  | "initialDepositCrypto"
  | "initialDepositFiat"
  | "apy"
  | "validator"
  | "exitAction"
  | "isExitActionPending"
  | "notice"
  | "showEarnMore"
>;

/** The validator row: its name, or its shortened vote account. None while it is not delegated. */
function validatorOf({ validatorName, validatorAddress, validatorLogoUrl }: EarnPosition) {
  const name =
    validatorName ?? (validatorAddress === "" ? undefined : middleEllipsis(validatorAddress));
  return name === undefined ? undefined : { name, imageUrl: validatorLogoUrl };
}

/** The validator the confirmation names, or the shortened stake account of a position with none. */
export function getStakePositionValidatorName(position: EarnPosition): string {
  return validatorOf(position)?.name ?? middleEllipsis(position.id);
}

/** The rate of the position as the Earn dashboard shows it: none for a status without the row. */
function rateOf(
  { interest }: EarnPosition,
  status: StakePositionState,
  format: StakePositionFormatter,
): StakePositionRate | undefined {
  if (interest === undefined || !APY_ROW_STATES.has(status)) return undefined;
  if (interest.value === 0 && !SHOWS_ZERO_RATE) return undefined;
  return { value: format.percent(interest.value), type: interest.type };
}

/**
 * The details of a position: every figure from the backend position, the exit from the chain
 * only. No figure falls back to the chain or the caller.
 */
export function toStakePositionDetailsProps(
  { position, status, isStale, isPolling }: ReadyStakePositionData,
  chainExit: StakePositionChainExit,
  format: StakePositionFormatter,
): StakePositionDetailsData {
  const { totalRewards, balance, deposited } = position;
  const initialDeposit =
    SHOWS_INITIAL_DEPOSIT && deposited !== undefined ? format.amount(deposited) : undefined;
  const isOutOfDate =
    (STALE_SHOWS_UPDATING && isStale) || !isStatusConsistent(position.status, chainExit.state);

  return {
    status,
    totalRewards: totalRewards === undefined ? undefined : format.amount(totalRewards),
    rewardsHeadline: totalRewards === undefined ? undefined : format.rewardsHeadline(totalRewards),
    currentBalance: balance === undefined ? undefined : format.amount(balance),
    initialDepositCrypto: initialDeposit?.crypto,
    initialDepositFiat: initialDeposit?.fiat,
    apy: rateOf(position, status, format),
    validator: validatorOf(position),
    exitAction: chainExit.action,
    isExitActionPending: chainExit.isPending || (EXIT_WAITS_FOR_POLLING && isPolling),
    notice: selectNotice({ isPolling, chainNotice: chainExit.notice, isOutOfDate }),
    showEarnMore: EARN_MORE_STATES.has(chainExit.state),
  };
}
