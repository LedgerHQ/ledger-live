import React, { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { useSelector } from "LLD/hooks/redux";
import type { formatCurrencyUnitOptions } from "@ledgerhq/live-common/currencies/index";
import type { AleoAccount, AleoTokenAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { dayAndHourFormat, useDateFormatter } from "~/renderer/hooks/useDateFormatter";
import ButtonV3 from "~/renderer/components/ButtonV3";
import Spinner from "~/renderer/components/Spinner";
import { getAccountCurrency, getParentAccount } from "@ledgerhq/live-common/account/helpers";
import { useAleoPrivateSync } from "./hooks/useAleoPrivateSync";
import { getAleoCurrencyConfig, formatAleoBalances } from "./shared/utils";

type AleoSyncState = "ready" | "running" | "complete";

const SyncActionButton = styled(ButtonV3).attrs(() => ({
  variant: "main",
}))`
  min-width: 130px;
`;

const ActionButton = ({
  syncState,
  onStart,
  onStop,
  onSyncAgain,
}: {
  syncState: AleoSyncState;
  onStart: () => void;
  onStop: () => void;
  onSyncAgain: () => void;
}) => {
  const { t } = useTranslation();

  switch (syncState) {
    case "ready":
      return (
        <SyncActionButton onClick={onStart} buttonTestId="start-private-sync-button">
          <Text>{t("aleo.account.syncButton.startSync")}</Text>
        </SyncActionButton>
      );
    case "running":
      return (
        <SyncActionButton onClick={onStop} buttonTestId="stop-private-sync-button">
          <Text>{t("aleo.account.syncButton.stopSync")}</Text>
        </SyncActionButton>
      );
    case "complete":
      return (
        <SyncActionButton onClick={onSyncAgain} buttonTestId="sync-again-button">
          <Text>{t("aleo.account.syncButton.syncAgain")}</Text>
        </SyncActionButton>
      );
  }
};

const SyncProgress = ({
  syncState,
  progress,
  lastSync,
}: {
  syncState: AleoSyncState;
  progress: number;
  lastSync: Date | null;
}) => {
  const formatDayAndHour = useDateFormatter(dayAndHourFormat);

  if (syncState === "running") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "row",
          fontSize: "12px",
          paddingLeft: "20px",
        }}
      >
        <Spinner size={14} />
        <Text style={{ fontSize: "12px", paddingLeft: "10px", minWidth: "40px" }}>{progress}%</Text>
      </div>
    );
  }

  if (syncState === "complete") {
    const formattedLastSync = lastSync ? formatDayAndHour(lastSync) : "";

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "12px",
          paddingTop: "10px",
        }}
      >
        <Trans i18nKey="aleo.account.syncButton.lastSync" values={{ date: formattedLastSync }} />
      </div>
    );
  }

  return null;
};

const BalanceRow = ({
  titleKey,
  tooltipKey,
  formattedValue,
}: {
  titleKey: string;
  tooltipKey: string;
  formattedValue: string;
}) => (
  <BalanceDetail>
    <ToolTip content={<Trans i18nKey={tooltipKey} />}>
      <TitleWrapper>
        <Title>
          <Trans i18nKey={titleKey} />
        </Title>
        <InfoCircle size={13} />
      </TitleWrapper>
    </ToolTip>
    <AmountValue>
      <Discreet>{formattedValue}</Discreet>
    </AmountValue>
  </BalanceDetail>
);

interface Props {
  account: AleoAccount | TokenAccount;
}

const AccountBalanceSummaryFooter = ({ account }: Readonly<Props>) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const allAccounts = useSelector(accountsSelector);

  const mainAccount =
    account.type === "TokenAccount" ? getParentAccount(account, allAccounts) : account;
  const config = getAleoCurrencyConfig(getAccountCurrency(account));
  const formatConfig: formatCurrencyUnitOptions = {
    alwaysShowSign: false,
    showCode: true,
    discreet,
    disableRounding: true,
    locale,
  };

  const {
    isSyncing,
    progress: hookProgress,
    start: handleStart,
    stop: handleStop,
  } = useAleoPrivateSync({
    account: mainAccount,
    autoStart: account.type === "Account" && !account.aleoResources?.lastPrivateSyncDate,
    keepAliveOnUnmount: true,
  });

  const [displaySyncing, setDisplaySyncing] = useState(isSyncing);
  const finishDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hookProgressRef = useRef(hookProgress);
  hookProgressRef.current = hookProgress;

  useEffect(() => {
    if (isSyncing) {
      setDisplaySyncing(true);
    } else if (hookProgressRef.current >= 100) {
      finishDelayRef.current = setTimeout(() => setDisplaySyncing(false), 200);
    } else {
      setDisplaySyncing(false);
    }
    return () => {
      if (finishDelayRef.current) clearTimeout(finishDelayRef.current);
    };
  }, [isSyncing]);

  if (account.type === "TokenAccount" && config?.enableTokens) {
    const aleoTokenAccount = account as AleoTokenAccount;
    const formattedBalances = formatAleoBalances({
      unit,
      formatConfig,
      balances: {
        spendableBalance: aleoTokenAccount.spendableBalance,
        transparentBalance: aleoTokenAccount.transparentBalance,
        privateBalance: aleoTokenAccount.privateBalance,
      },
    });

    return (
      <Wrapper>
        <BalanceRow
          titleKey="aleo.account.availableBalance"
          tooltipKey="aleo.account.availableBalanceTooltip"
          formattedValue={formattedBalances.available}
        />
        <BalanceRow
          titleKey="aleo.account.transparentBalance"
          tooltipKey="aleo.account.transparentBalanceTooltip"
          formattedValue={formattedBalances.transparent}
        />
        <BalanceRow
          titleKey="aleo.account.privateBalance"
          tooltipKey="aleo.account.privateBalanceTooltip"
          formattedValue={formattedBalances.private}
        />
      </Wrapper>
    );
  }

  if (account.type !== "Account" || !account.aleoResources) {
    return null;
  }

  const lastSync = account.aleoResources.lastPrivateSyncDate ?? null;
  const syncState: AleoSyncState = displaySyncing ? "running" : lastSync ? "complete" : "ready";
  const formattedBalances = formatAleoBalances({
    unit,
    formatConfig,
    balances: {
      spendableBalance: account.spendableBalance,
      transparentBalance: account.aleoResources.transparentBalance,
      privateBalance: account.aleoResources.privateBalance,
    },
  });

  return (
    <Wrapper>
      <BalanceRow
        titleKey="aleo.account.availableBalance"
        tooltipKey="aleo.account.availableBalanceTooltip"
        formattedValue={formattedBalances.available}
      />
      <BalanceRow
        titleKey="aleo.account.transparentBalance"
        tooltipKey="aleo.account.transparentBalanceTooltip"
        formattedValue={formattedBalances.transparent}
      />
      <BalanceRow
        titleKey="aleo.account.privateBalance"
        tooltipKey="aleo.account.privateBalanceTooltip"
        formattedValue={formattedBalances.private}
      />
      <BalanceDetail>
        <div
          style={{
            display: "flex",
            flexDirection: syncState === "running" ? "row" : "column",
          }}
        >
          <ActionButton
            syncState={syncState}
            onStart={handleStart}
            onStop={handleStop}
            onSyncAgain={handleStart}
          />
          <SyncProgress syncState={syncState} progress={hookProgress} lastSync={lastSync} />
        </div>
      </BalanceDetail>
    </Wrapper>
  );
};

const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  mt: 4,
  p: 5,
  pb: 0,
  scroll: true,
}))`
  border-top: 1px solid ${p => p.theme.colors.neutral.c30};
`;

const BalanceDetail = styled(Box).attrs(() => ({
  flex: "0.25 0 auto",
  alignItems: "start",
  paddingRight: 20,
}))``;

const TitleWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  mb: 1,
}))``;

const Title = styled(Text).attrs(() => ({
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

export default AccountBalanceSummaryFooter;
