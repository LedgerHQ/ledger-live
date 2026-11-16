import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type {
  StakePositionExitAction,
  StakePositionHeading,
  StakePositionNotice,
  StakePositionState,
} from "../types";

export function useStakePositionTitle(heading: StakePositionHeading, ticker: string): string {
  const { t } = useTranslation();

  if (heading.kind === "details") return t("stakePosition.details.title", { ticker });
  const { action } = heading;
  return t(`stakePosition.confirm.${action}.title`, { ticker });
}

export type StakePositionDetailsLabels = Readonly<{
  balance: string;
  rewards: string;
  status: string;
  apy: string;
  validator: string;
  address: string;
  unavailableValue: string;
  earnMore: string;
  state: string;
  exitAction: string | null;
  notice: string | null;
}>;

type DetailsVariant = Readonly<{
  ticker: string;
  state: StakePositionState;
  exitAction: StakePositionExitAction | null;
  notice: StakePositionNotice | null;
}>;

export function useStakePositionDetailsLabels({
  ticker,
  state,
  exitAction,
  notice,
}: DetailsVariant): StakePositionDetailsLabels {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      balance: t("stakePosition.details.balance"),
      rewards: t("stakePosition.details.rewards"),
      status: t("stakePosition.details.status"),
      apy: t("stakePosition.details.apy"),
      validator: t("stakePosition.details.validator"),
      address: t("stakePosition.details.address"),
      unavailableValue: t("stakePosition.details.unavailableValue"),
      earnMore: t("stakePosition.actions.earnMore"),
      state: t(`stakePosition.status.${state}`),
      exitAction: exitAction === null ? null : t(`stakePosition.actions.${exitAction}`),
      notice: notice === null ? null : t(`stakePosition.notice.${notice}`, { ticker }),
    }),
    [t, ticker, state, exitAction, notice],
  );
}

export type StakePositionConfirmLabels = Readonly<{
  description: string;
  cta: string;
  amount: string;
  validator: string;
  fees: string;
}>;

export function useStakePositionConfirmLabels(
  ticker: string,
  action: StakePositionExitAction,
): StakePositionConfirmLabels {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      description: t(`stakePosition.confirm.${action}.description`, { ticker }),
      cta: t(`stakePosition.confirm.${action}.cta`),
      amount: t("stakePosition.confirm.amount"),
      validator: t("stakePosition.confirm.validator"),
      fees: t("stakePosition.confirm.fees"),
    }),
    [t, ticker, action],
  );
}

export type StakePositionUnavailableLabels = Readonly<{
  loading: string;
  notFoundTitle: string;
  notFoundDescription: string;
  close: string;
}>;

export function useStakePositionUnavailableLabels(): StakePositionUnavailableLabels {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      loading: t("stakePosition.unavailable.loading"),
      notFoundTitle: t("stakePosition.unavailable.notFoundTitle"),
      notFoundDescription: t("stakePosition.unavailable.notFoundDescription"),
      close: t("stakePosition.unavailable.close"),
    }),
    [t],
  );
}
