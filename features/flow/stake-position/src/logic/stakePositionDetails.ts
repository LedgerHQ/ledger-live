import type { EarnPosition } from "@domain/entity-earn-position";
import type { StakePositionDetailsProps } from "../components/StakePositionDetails/StakePositionDetails.types";
import type {
  ReadyStakePositionData,
  StakePositionChainExit,
  StakePositionFormatter,
} from "../types";
import { middleEllipsis } from "./display";
import { isStatusConsistent } from "./positionRules";
import {
  APY_ROW_STATES,
  EARN_MORE_STATES,
  EXIT_WAITS_FOR_POLLING,
  SHOWS_INITIAL_DEPOSIT,
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
  | "initialDeposit"
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

/**
 * The details of a position: every figure from the backend position, the exit from the chain
 * only. No figure falls back to the chain, the caller or the position APY.
 */
export function toStakePositionDetailsProps(
  { position, status, validatorApy, isStale, isPolling }: ReadyStakePositionData,
  chainExit: StakePositionChainExit,
  format: StakePositionFormatter,
): StakePositionDetailsData {
  const { totalRewards, balance, deposited } = position;
  const isOutOfDate =
    (STALE_SHOWS_UPDATING && isStale) || !isStatusConsistent(position.status, chainExit.state);

  return {
    status,
    totalRewards: totalRewards === undefined ? undefined : format.amount(totalRewards),
    rewardsHeadline: totalRewards === undefined ? undefined : format.rewardsHeadline(totalRewards),
    currentBalance: balance === undefined ? undefined : format.amount(balance),
    initialDeposit:
      SHOWS_INITIAL_DEPOSIT && deposited !== undefined ? format.amount(deposited) : undefined,
    apy:
      validatorApy !== undefined && APY_ROW_STATES.has(status)
        ? format.percent(validatorApy)
        : undefined,
    validator: validatorOf(position),
    exitAction: chainExit.action,
    isExitActionPending: chainExit.isPending || (EXIT_WAITS_FOR_POLLING && isPolling),
    notice: selectNotice({ isPolling, chainNotice: chainExit.notice, isOutOfDate }),
    showEarnMore: EARN_MORE_STATES.has(chainExit.state),
  };
}
