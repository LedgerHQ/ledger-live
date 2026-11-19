import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import type {
  StakePositionExitAction,
  StakePositionHeading,
  StakePositionNotice,
  StakePositionState,
} from "../types";

export function useStakePositionTitle(
  heading: StakePositionHeading,
  ticker: string,
  currencyName: string = ticker,
): string {
  const { t } = useTranslation();

  switch (heading.kind) {
    case "details":
      return t("stakePosition.details.title", { currencyName });
    case "confirm":
      return t(`stakePosition.confirm.${heading.action}.title`, { ticker });
    case "result":
      return t(`stakePosition.result.${heading.outcome}Title`);
  }
}

export type StakePositionDetailsLabels = Readonly<{
  totalRewards: string;
  currentBalance: string;
  sectionTitle: string;
  apy: string;
  status: string;
  account: string;
  validator: string;
  earnMore: string;
}>;

export type StakePositionDetailsCopy = Readonly<{
  labels: StakePositionDetailsLabels;
  state: string;
  exitAction: string | null;
  notice: string | null;
  apyBadge?: string;
}>;

type DetailsVariant = Readonly<{
  ticker: string;
  status: StakePositionState;
  exitAction: StakePositionExitAction | null;
  notice: StakePositionNotice | null;
  apy?: string;
}>;

export function useStakePositionDetailsCopy({
  ticker,
  status,
  exitAction,
  notice,
  apy,
}: DetailsVariant): StakePositionDetailsCopy {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      labels: {
        totalRewards: t("stakePosition.details.totalRewards"),
        currentBalance: t("stakePosition.details.currentBalance"),
        sectionTitle: t("stakePosition.details.sectionTitle"),
        apy: t("stakePosition.details.apy"),
        status: t("stakePosition.details.status"),
        account: t("stakePosition.details.account"),
        validator: t("stakePosition.details.validator"),
        earnMore: t("stakePosition.actions.earnMore"),
      },
      state: t(`stakePosition.status.${status}`),
      exitAction: exitAction === null ? null : t(`stakePosition.actions.${exitAction}`),
      notice: notice === null ? null : t(`stakePosition.notice.${notice}`, { ticker }),
      apyBadge: apy === undefined ? undefined : t("stakePosition.details.apyBadge", { apy }),
    }),
    [t, ticker, status, exitAction, notice, apy],
  );
}

export type StakePositionConfirmLabels = Readonly<{
  title: string;
  description: string;
  cta: string;
}>;

/** What the description of the confirmation names. */
export type StakePositionConfirmValues = Readonly<{
  /** The chain snapshot figure of the prepared transaction, formatted with its ticker. */
  amount: string;
  validator: string;
  account: string;
}>;

export function useStakePositionConfirmLabels(
  ticker: string,
  action: StakePositionExitAction,
  { amount, validator, account }: StakePositionConfirmValues,
): StakePositionConfirmLabels {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      title: t(`stakePosition.confirm.${action}.title`, { ticker }),
      description: t(`stakePosition.confirm.${action}.description`, {
        amount,
        validator,
        account,
      }),
      cta: t(`stakePosition.confirm.${action}.cta`),
    }),
    [t, ticker, action, amount, validator, account],
  );
}

export type StakePositionResultLabels = Readonly<{
  title: string;
  description?: string;
  cta: string;
  broadcastError: string;
}>;

type ResultVariant =
  | Readonly<{ outcome: "success"; action: StakePositionExitAction; ticker: string }>
  | Readonly<{ outcome: "failure" }>;

export function useStakePositionResultLabels(variant: ResultVariant): StakePositionResultLabels {
  const { t } = useTranslation();
  const action = variant.outcome === "success" ? variant.action : null;
  const ticker = variant.outcome === "success" ? variant.ticker : null;

  return useMemo(
    () => ({
      title: t(`stakePosition.result.${action === null ? "failure" : "success"}Title`),
      description:
        action === null ? undefined : t(`stakePosition.result.${action}Description`, { ticker }),
      cta:
        action === null
          ? t("stakePosition.result.retry")
          : t("stakePosition.result.viewTransaction"),
      broadcastError: t("stakePosition.result.broadcastError"),
    }),
    [t, action, ticker],
  );
}

export type StakePositionUnavailableLabels = Readonly<{
  loading: string;
  notFoundTitle: string;
  notFoundDescription: string;
  errorTitle: string;
  errorDescription: string;
  retry: string;
  close: string;
}>;

export function useStakePositionUnavailableLabels(): StakePositionUnavailableLabels {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      loading: t("stakePosition.unavailable.loading"),
      notFoundTitle: t("stakePosition.unavailable.notFoundTitle"),
      notFoundDescription: t("stakePosition.unavailable.notFoundDescription"),
      errorTitle: t("stakePosition.unavailable.errorTitle"),
      errorDescription: t("stakePosition.unavailable.errorDescription"),
      retry: t("stakePosition.unavailable.retry"),
      close: t("stakePosition.unavailable.close"),
    }),
    [t],
  );
}
