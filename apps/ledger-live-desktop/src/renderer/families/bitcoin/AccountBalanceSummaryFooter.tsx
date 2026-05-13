import React, { useCallback, useEffect, useRef } from "react";
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
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import type { Currency } from "@ledgerhq/coin-bitcoin/wallet-btc/index";
import type { ZcashAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import {
  ZcashPrivateInfo,
  ZcashSyncState,
} from "@ledgerhq/coin-bitcoin/chain-adapters/zcash/types";
import { syncStateUpdater } from "./ZCashExportKeyFlowModal/sync";
import {
  ZCASH_CHECK_OUTDATED_SYNC_INTERVAL,
  ZCASH_OUTDATED_SYNC_INTERVAL_MINUTES,
} from "@ledgerhq/coin-bitcoin/chain-adapters/zcash/constants";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { from, switchMap } from "rxjs";
import {
  removeShieldedSubscription,
  selectShieldedSubscriptions,
  upsertShieldedSubscription,
} from "~/renderer/reducers/shieldedSyncSubscriptions";

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
    case "complete":
      return (
        <ActionButtonElement buttonTestId="up-to-date-button" disabled>
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

function usePrevious<T>(val: T): T {
  const ref = useRef<T>(val);
  const prevVal = ref.current;
  ref.current = val;
  return prevVal;
}

type Props = {
  account: ZcashAccount | TokenAccount;
};

const AccountBalanceSummaryFooter = ({ account }: Props) => {
  const { balance } = account;
  const { getFeature } = useFeatureFlags();
  const showPrivateBalanceComponent = getFeature("zcashShielded")?.enabled;

  const privateInfo = "privateInfo" in account ? account.privateInfo : null;
  const { orchardBalance, saplingBalance } = privateInfo ?? {
    orchardBalance: BigNumber(0),
    saplingBalance: BigNumber(0),
  };
  const syncState = privateInfo?.syncState ?? "disabled";
  const previousSyncState = usePrevious(syncState);
  const lastSync = privateInfo?.lastSyncTimestamp ? new Date(privateInfo.lastSyncTimestamp) : null;
  const progress = privateInfo?.progress ?? 0;
  const estimatedTimeRemaining = privateInfo?.estimatedTimeRemaining ?? { hours: 0, minutes: 0 };

  const shieldedSubscriptions = useSelector(selectShieldedSubscriptions);

  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Save sync state to the account
  const saveSyncState = useCallback(
    (info: Partial<ZcashPrivateInfo>) => {
      dispatch(syncStateUpdater(account as ZcashAccount, info));
    },
    [account, dispatch],
  );

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
    }
  };

  const startShieldedSync = useCallback(() => {
    if (account.type !== "Account" || (account.currency.id as Currency) !== "zcash") {
      return;
    }

    saveSyncState({
      syncState: "running",
      progress: 0,
    });

    const syncConfig = {
      paginationConfig: {},
      syncType: SYNC_TYPE_SHIELDED,
    };

    const shieldedSync = from(Promise.resolve(getAccountBridge(account as ZcashAccount)))
      .pipe(switchMap(bridge => bridge.sync(account as ZcashAccount, syncConfig)))
      .subscribe({
        next(accountUpdater) {
          dispatch(updateAccountWithUpdater(account.id, accountUpdater));
        },
        error(err) {
          console.error(err);
        },
        complete() {
          console.log(`Zcash shielded sync completed on account ${account.id}`);
        },
      });
    dispatch(upsertShieldedSubscription({ accountId: account.id, subscription: shieldedSync }));
  }, [account, dispatch, saveSyncState]);

  const stopShieldedSync = useCallback(() => {
    if (account.type !== "Account" || (account.currency.id as Currency) !== "zcash") {
      return;
    }

    const subscriptionToStop = shieldedSubscriptions.find(s => s.accountId === account.id);
    if (subscriptionToStop) {
      subscriptionToStop.subscription.unsubscribe();
      dispatch(removeShieldedSubscription(account.id));
    }
    saveSyncState({
      syncState: "stopped",
      progress: 0,
    });
  }, [account, dispatch, shieldedSubscriptions, saveSyncState]);

  // Check if sync is outdated
  const outdatedSyncCheck = useCallback(() => {
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

  // Check if private balance has been activated
  useEffect(() => {
    if (previousSyncState === "disabled" && syncState === "running") {
      startShieldedSync();
    }
  }, [previousSyncState, syncState, startShieldedSync]);

  // Check if sync is outdated (every 5 seconds)
  useEffect(() => {
    if (syncState === "complete") {
      outdatedSyncCheck();
      const interval = setInterval(() => outdatedSyncCheck(), ZCASH_CHECK_OUTDATED_SYNC_INTERVAL);
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [syncState, outdatedSyncCheck]);

  // Check on mount if there is a subscription for this account, if not update the sync state to "stopped"
  useEffect(() => {
    const hasShieldedSubscription = shieldedSubscriptions.some(s => s.accountId === account.id);
    const justEnteredRunning = syncState === "running" && previousSyncState !== "running";

    if (syncState === "running" && !hasShieldedSubscription && !justEnteredRunning) {
      stopShieldedSync();
    }
  }, [account.id, previousSyncState, shieldedSubscriptions, syncState, stopShieldedSync]);

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

  const _transparentBalance = balance ?? BigNumber(0);
  const _privateBalance = orchardBalance.plus(saplingBalance);
  const _availableBalance = _transparentBalance.plus(_privateBalance);

  const transparentBalanceLabel = formatCurrencyUnit(unit, _transparentBalance, formatConfig);
  const privateBalanceLabel = formatCurrencyUnit(unit, _privateBalance, formatConfig);
  const availableBalanceLabel = formatCurrencyUnit(unit, _availableBalance, formatConfig);

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
        <EstimatedTimeRemaining
          syncState={syncState}
          estimatedTimeRemaining={estimatedTimeRemaining}
        />
      </BalanceDetail>
    </Wrapper>
  );
};

export default AccountBalanceSummaryFooter;
