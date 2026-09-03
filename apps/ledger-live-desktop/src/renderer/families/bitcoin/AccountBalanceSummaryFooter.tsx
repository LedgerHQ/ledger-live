import React from "react";
import styled from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import BigNumber from "bignumber.js";
import { useFeature } from "@features/platform-feature-flags";
import { TFunction } from "i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import TriangleWarning from "~/renderer/icons/TriangleWarning";
import ToolTip from "~/renderer/components/Tooltip";
import ButtonV3 from "~/renderer/components/ButtonV3";
import Spinner from "~/renderer/components/Spinner";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { openModal } from "~/renderer/actions/modals";
import type { Currency } from "@ledgerhq/wallet-btc/index";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import type { ZcashSyncState } from "@ledgerhq/coin-zcash/network/types";
import {
  getPrivateBalance,
  getTransparentBalance,
} from "@ledgerhq/coin-zcash/logic/account/balance";
import {
  getMaturingIronwoodBalance,
  getSpendableIronwoodBalance,
  hasMaturingIronwoodNotes,
} from "@ledgerhq/coin-zcash/logic/account/spendability";
import { getReservedNullifiers } from "@ledgerhq/coin-zcash/bridge/note-reservation";
import { useZcashShieldedSync } from "./useZcashShieldedSync";

const Container = styled(Box).attrs(() => ({
  mt: 4,
  p: 5,
  pb: 0,
}))`
  border-top: 1px solid ${p => p.theme.colors.neutral.c30};
`;

const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  scroll: true,
}))`
  justify-content: flex-start;
`;

const Separator = styled(Box).attrs(() => ({
  mt: 4,
}))`
  border-top: 1px solid ${p => p.theme.colors.neutral.c30};
`;

const WarningWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  color: "warning.c70",
  mt: 3,
}))``;

const BalanceDetail = styled(Box).attrs(() => ({
  flex: "0 0 auto",
  alignItems: "start",
  paddingRight: 50,
}))``;

const TooltipWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: ${p => p.theme.space[1]}px;
`;

export const TitleWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  mb: 1,
}))``;

export const Title = styled(Text).attrs(() => ({
  fontSize: 4,
  ff: "Inter|Medium",
  color: "neutral.c70",
}))`
  line-height: ${p => p.theme.space[4]}px;
  margin-right: ${p => p.theme.space[1]}px;
`;

const AmountValue = styled(Text).attrs(() => ({
  fontSize: 6,
  ff: "Inter|SemiBold",
  color: "neutral.c100",
}))<{ paddingRight?: number }>`
  ${p => p.paddingRight && `padding-right: ${p.paddingRight}px`};
`;

const WarningBannerText = styled(Text).attrs(() => ({
  fontSize: 3,
  ff: "Inter|Medium",
  color: "warning.c70",
  ml: 2,
}))``;

const ActionButton = ({
  t,
  syncState,
  updateSyncState,
}: {
  t: TFunction<"translation", undefined>;
  syncState: ZcashSyncState;
  updateSyncState: () => void;
}) => {
  const ActionButtonElement = styled(ButtonV3).attrs(() => ({
    variant: "main",
    onClick: updateSyncState,
  }))`
    min-width: 130px;
  `;

  switch (syncState) {
    case "disabled":
      return (
        <ActionButtonElement buttonTestId="show-private-balance-button">
          <Text>{t("zcash.shielded.state.showBalance")}</Text>
        </ActionButtonElement>
      );
    case "ready":
    case "stopped":
    case "outdated":
      return (
        <ActionButtonElement buttonTestId="start-sync-button">
          <Text>{t("zcash.shielded.state.startSync")}</Text>
        </ActionButtonElement>
      );
    case "running":
      return (
        <ActionButtonElement buttonTestId="stop-sync-button">
          <Text>{t("zcash.shielded.state.stopSync")}</Text>
        </ActionButtonElement>
      );
    case "complete":
      return (
        <ActionButtonElement buttonTestId="up-to-date-button">
          <Text>{t("zcash.shielded.state.upToDate")}</Text>
        </ActionButtonElement>
      );
  }
};

const SyncProgress = ({
  syncState,
  progress,
  lastSync,
}: {
  syncState: ZcashSyncState;
  progress: number;
  lastSync: Date | null;
}) => {
  if (syncState !== "disabled") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "row",
          fontSize: "12px",
          paddingLeft: syncState === "running" || syncState === "stopped" ? "20px" : "0",
          paddingTop: syncState === "complete" || syncState === "outdated" ? "10px" : "0",
        }}
      >
        {syncState === "running" ? (
          <>
            <Spinner size={14} />
            <Text style={{ fontSize: "12px", paddingLeft: "10px" }}>{progress}%</Text>
          </>
        ) : null}
        {syncState === "complete" || syncState === "outdated" ? (
          <Trans
            i18nKey="zcash.shielded.state.lastSync"
            values={{ date: lastSync?.toLocaleString().replace(",", "") }}
          />
        ) : null}
      </div>
    );
  }

  return null;
};

const EstimatedTimeRemaining = ({
  syncState,
  estimatedTimeRemaining,
  disabled = true,
}: {
  syncState: ZcashSyncState;
  estimatedTimeRemaining: { hours: number; minutes: number };
  disabled?: boolean;
}) => {
  if (
    syncState !== "running" ||
    (estimatedTimeRemaining.hours === 0 && estimatedTimeRemaining.minutes === 0) ||
    !!disabled
  ) {
    return null;
  }

  const { hours, minutes } = estimatedTimeRemaining;

  return (
    <Text style={{ fontSize: "12px", paddingTop: "10px" }}>
      <Trans
        i18nKey="zcash.shielded.state.estimatedTimeRemaining"
        values={{
          hours: String(hours).padStart(2, "0"),
          minutes: String(minutes).padStart(2, "0"),
        }}
      />
    </Text>
  );
};

type Props = {
  account: ZcashAccount | TokenAccount;
};

const AccountBalanceSummaryFooter = ({ account }: Props) => {
  const { balance } = account;
  const showPrivateBalanceComponent = useFeature("zcashShielded")?.enabled;

  const privateInfo = "privateInfo" in account ? account.privateInfo : null;
  const syncState = privateInfo?.syncState ?? "disabled";
  const lastSync = privateInfo?.lastSyncTimestamp ? new Date(privateInfo.lastSyncTimestamp) : null;
  const progress = privateInfo?.progress ?? 0;
  const estimatedTimeRemaining = privateInfo?.estimatedTimeRemaining ?? { hours: 0, minutes: 0 };

  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { startShieldedSync, stopShieldedSync } = useZcashShieldedSync(account as ZcashAccount);

  const updateSyncState = () => {
    if (account.type !== "Account" || (account.currency.id as Currency) !== "zcash") {
      return;
    }

    switch (syncState) {
      case "disabled":
        // Open modal to import UFVK
        dispatch(openModal("MODAL_ZCASH_EXPORT_KEY", { account: account as ZcashAccount }));
        break;
      case "ready":
        // Start
        startShieldedSync();
        break;
      case "running":
        // Stop
        stopShieldedSync();
        break;
      case "stopped":
        // Start
        startShieldedSync();
        break;
      case "outdated":
        // Start sync from the last known block
        startShieldedSync();
        break;
      case "complete":
        startShieldedSync();
        break;
    }
  };

  if (
    account.type !== "Account" ||
    (account.currency.id as Currency) !== "zcash" ||
    !showPrivateBalanceComponent
  ) {
    return null;
  }

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  // Each label is derived from its own source rather than one from another, so
  // they stay correct regardless of which module (coin-bitcoin flag-off adapter
  // vs coin-zcash) last wrote `account.balance` — a toggle or a pre-first-sync
  // flag-ON no longer yields an under-reported or negative transparent balance.
  const bitcoinResources = "bitcoinResources" in account ? account.bitcoinResources : undefined;
  const _transparentBalance = getTransparentBalance(bitcoinResources?.utxos);
  // The account page reports holdings, so this stays the account's total
  // private balance -- funds held by an immature note remain part of it and
  // stay visible, never made to look like they vanished.
  const _privateBalance = getPrivateBalance(privateInfo);
  const _availableBalance = balance ?? BigNumber(0);

  const zcashAccount = account as ZcashAccount;
  const hasMaturingFunds = hasMaturingIronwoodNotes(zcashAccount);
  // Spending one note returns its whole remainder as a single fresh note, so
  // right after a send nearly the entire private balance is maturing. Leading
  // with what is still spendable is what keeps that from reading as "all your
  // funds are locked", and it is the figure the send flow will actually offer.
  const _spendableBalance = getSpendableIronwoodBalance(
    zcashAccount,
    getReservedNullifiers(zcashAccount),
  );
  // Counted from immaturity alone, not as `total - spendable`: that difference
  // also swallows the notes an in-flight spend has reserved, which would label
  // a pending transaction of the user's own as "maturing".
  const _maturingAmount = getMaturingIronwoodBalance(zcashAccount);

  const transparentBalanceLabel = formatCurrencyUnit(unit, _transparentBalance, formatConfig);
  const privateBalanceLabel = formatCurrencyUnit(unit, _privateBalance, formatConfig);
  const availableBalanceLabel = formatCurrencyUnit(unit, _availableBalance, formatConfig);
  const maturingAmountLabel = formatCurrencyUnit(unit, _maturingAmount, formatConfig);
  const spendableBalanceLabel = formatCurrencyUnit(unit, _spendableBalance, formatConfig);

  return (
    <Container>
      <Wrapper>
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="zcash.account.availableBalanceTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="zcash.account.availableBalance" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{availableBalanceLabel}</Discreet>
          </AmountValue>
        </BalanceDetail>
        <BalanceDetail>
          <ToolTip content={<Trans i18nKey="zcash.account.transparentBalanceTooltip" />}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="zcash.account.transparentBalance" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{transparentBalanceLabel}</Discreet>
          </AmountValue>
        </BalanceDetail>
        <BalanceDetail>
          <ToolTip
            content={
              <TooltipWrapper>
                <div>
                  <Trans i18nKey="zcash.account.privateBalanceTooltip" />
                </div>
                <div>
                  <Trans i18nKey="zcash.account.privateBalanceWarning" />
                </div>
              </TooltipWrapper>
            }
          >
            <TitleWrapper>
              <Title>
                <Trans i18nKey="zcash.account.privateBalance" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{privateBalanceLabel}</Discreet>
          </AmountValue>
        </BalanceDetail>
        <BalanceDetail>
          <div
            style={{
              display: "flex",
              flexDirection: syncState === "running" || syncState === "stopped" ? "row" : "column",
            }}
          >
            <ActionButton t={t} syncState={syncState} updateSyncState={updateSyncState} />
            <SyncProgress syncState={syncState} progress={progress} lastSync={lastSync} />
          </div>
          <EstimatedTimeRemaining
            syncState={syncState}
            estimatedTimeRemaining={estimatedTimeRemaining}
          />
        </BalanceDetail>
      </Wrapper>
      <Separator />

      {hasMaturingFunds ? (
        <WarningWrapper>
          <TriangleWarning size={16} />
          <WarningBannerText data-testid="zcash-private-maturing-amount">
            <Discreet>
              <Trans
                i18nKey="zcash.account.privateBalanceMaturing"
                values={{ spendable: spendableBalanceLabel, maturing: maturingAmountLabel }}
              />
            </Discreet>
          </WarningBannerText>
        </WarningWrapper>
      ) : null}

      {syncState === "stopped" && privateInfo?.lastSyncError ? (
        <WarningWrapper>
          <TriangleWarning size={16} />
          <WarningBannerText data-testid="zcash-sync-failed-warning">
            <Trans i18nKey="zcash.shielded.state.syncFailed" />
          </WarningBannerText>
        </WarningWrapper>
      ) : null}
    </Container>
  );
};

export default AccountBalanceSummaryFooter;
