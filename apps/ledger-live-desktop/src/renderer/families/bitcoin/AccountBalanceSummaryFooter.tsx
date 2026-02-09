import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import BigNumber from "bignumber.js";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { TFunction } from "i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import ButtonV3 from "~/renderer/components/ButtonV3";
import Spinner from "~/renderer/components/Spinner";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { openModal } from "~/renderer/actions/modals";
import type { Currency } from "@ledgerhq/coin-bitcoin/wallet-btc/index";
import type {
  ZcashAccount,
  ZcashPrivateInfo,
  ZcashSyncState,
} from "@ledgerhq/live-common/families/bitcoin/types";
import { syncStateUpdater } from "./ZCashExportKeyFlowModal/sync";
import { TokenAccount } from "@ledgerhq/types-live";
import { ZCASH_OUTDATED_SYNC_INTERVAL_MINUTES } from "@ledgerhq/zcash-shielded/constants";

const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  mt: 4,
  p: 5,
  pb: 0,
  scroll: true,
}))`
  border-top: 1px solid ${p => p.theme.colors.neutral.c30};
  justify-content: flex-start;
`;

const BalanceDetail = styled(Box).attrs(() => ({
  flex: "0 0 auto",
  alignItems: "start",
  paddingRight: 50,
}))``;

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
          paddingTop: syncState === "outdated" ? "10px" : "0",
        }}
      >
        {syncState === "running" ? (
          <>
            <Spinner size={14} />
            <Text style={{ fontSize: "12px", paddingLeft: "10px" }}>{progress}%</Text>
          </>
        ) : null}
        {syncState === "stopped" ? (
          <Text style={{ fontSize: "12px" }}>
            <Trans
              i18nKey="zcash.shielded.state.lastProcessedBlock"
              values={{ block: 1, missing: 10 }}
            />
          </Text>
        ) : null}
        {syncState === "complete" || syncState === "outdated" ? (
          <Trans
            i18nKey="zcash.shielded.state.lastSync"
            values={{ date: lastSync?.toLocaleString().replace(",", "") }}
            style={{}}
          />
        ) : null}
      </div>
    );
  }

  return null;
};

type Props = {
  account: ZcashAccount | TokenAccount;
};

const AccountBalanceSummaryFooter = ({ account }: Props) => {
  const { balance } = account;
  const privateInfo = account.type === "Account" ? account.privateInfo : null;
  const { orchardBalance, saplingBalance } = privateInfo ?? {
    orchardBalance: BigNumber(0),
    saplingBalance: BigNumber(0),
  };
  const syncState = privateInfo?.syncState ?? "disabled";
  const lastSync = privateInfo?.lastSyncTimestamp ? new Date(privateInfo.lastSyncTimestamp) : null;

  const [progress, setProgress] = useState(0);

  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const { getFeature } = useFeatureFlags();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Save sync state to the account
  const saveSyncState = useCallback(
    (info: Partial<ZcashPrivateInfo>) => {
      dispatch(syncStateUpdater(account as ZcashAccount, info));
    },
    [account, dispatch],
  );

  // TODO: Mocking progress. Delete this once we have a real progress.
  useEffect(() => {
    if (syncState === "running" && progress < 100) {
      const interval = setInterval(() => setProgress(progress + 10), 500);
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [syncState, progress]);

  // Check if sync is outdated
  const isSyncOutdated = useCallback(() => {
    const now = new Date().getTime();
    if (
      privateInfo?.lastSyncTimestamp &&
      now - privateInfo.lastSyncTimestamp > 1000 * 60 * ZCASH_OUTDATED_SYNC_INTERVAL_MINUTES
    ) {
      saveSyncState({
        syncState: "outdated",
      });
    }
  }, [privateInfo?.lastSyncTimestamp, saveSyncState]);

  // Check if sync is outdated (every 5 seconds)
  useEffect(() => {
    if (syncState === "complete") {
      isSyncOutdated();
      setProgress(0);
      const interval = setInterval(() => isSyncOutdated(), 5000);
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [syncState, isSyncOutdated]);

  // Set sync state to complete when progress is 100
  useEffect(() => {
    if (syncState === "running" && progress === 100) {
      saveSyncState({
        syncState: "complete",
        lastSyncTimestamp: new Date().getTime(),
      });
    }
  }, [syncState, progress, saveSyncState]);

  const showPrivateBalanceComponent = getFeature("zcashShielded")?.enabled;

  if (
    account.type !== "Account" ||
    (account.currency.id as Currency) !== "zcash" ||
    !showPrivateBalanceComponent
  )
    return null;

  const formatConfig = {
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  };

  const _transparentBalance = balance ?? BigNumber(0);
  const _privateBalance = orchardBalance.plus(saplingBalance);
  const _availableBalance = _transparentBalance.plus(_privateBalance);

  const transparentBalanceLabel = formatCurrencyUnit(unit, _transparentBalance, formatConfig);
  const privateBalanceLabel = formatCurrencyUnit(unit, _privateBalance, formatConfig);
  const availableBalanceLabel = formatCurrencyUnit(unit, _availableBalance, formatConfig);

  const updateSyncState = () => {
    switch (syncState) {
      case "disabled":
        // Open modal to import UFVK
        dispatch(openModal("MODAL_ZCASH_EXPORT_KEY", { account }));
        break;
      case "ready":
        // Start
        saveSyncState({
          syncState: "running",
        });
        break;
      case "running":
        // Stop
        setProgress(0);
        saveSyncState({
          syncState: "stopped",
        });
        break;
      case "stopped":
        // Start
        saveSyncState({
          syncState: "running",
        });
        break;
      case "outdated":
        // Start sync from the last known block
        saveSyncState({
          syncState: "running",
        });
        break;
    }
  };

  return (
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
        <ToolTip content={<Trans i18nKey="zcash.account.privateBalanceTooltip" />}>
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
      </BalanceDetail>
    </Wrapper>
  );
};

export default AccountBalanceSummaryFooter;
