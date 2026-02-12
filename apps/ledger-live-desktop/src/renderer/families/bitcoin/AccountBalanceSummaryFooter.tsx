import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import BigNumber from "bignumber.js";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { Pause, Refresh } from "@ledgerhq/lumen-ui-react/symbols";
import { TFunction } from "i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { zcashSyncStartNonceSelector, zcashSyncStateSelector } from "~/renderer/reducers/zcashSync";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import ButtonV3 from "~/renderer/components/ButtonV3";
import Spinner from "~/renderer/components/Spinner";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { openModal } from "~/renderer/actions/modals";
import { startZcashSync } from "~/renderer/reducers/zcashSync";
import type { Currency } from "@ledgerhq/coin-bitcoin/wallet-btc/index";
import type { BitcoinAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import type { TokenAccount } from "@ledgerhq/types-live";

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

type ZCashSyncState = "disabled" | "ready" | "running" | "paused" | "complete" | "outdated";

const ActionButton = ({
  t,
  syncState,
  updateSyncState,
}: {
  t: TFunction<"translation", undefined>;
  syncState: ZCashSyncState;
  updateSyncState: () => void;
}) => {
  switch (syncState) {
    case "disabled":
      return (
        <ButtonV3
          variant="main"
          onClick={updateSyncState}
          buttonTestId="show-private-balance-button"
        >
          <Text>{t("zcash.shielded.state.showBalance")}</Text>
        </ButtonV3>
      );
    case "ready":
      return (
        <ButtonV3 variant="main" onClick={updateSyncState}>
          <Text>{t("zcash.shielded.startSync")}</Text>
        </ButtonV3>
      );
    case "paused":
      return (
        <ButtonV3
          variant="main"
          Icon={<Refresh size={20} />}
          style={{ padding: "100%", fontSize: 1 }}
          onClick={updateSyncState}
        />
      );
    case "running":
      return (
        <ButtonV3
          variant="main"
          Icon={<Pause size={20} />}
          style={{ padding: "100%", fontSize: 1 }}
          onClick={updateSyncState}
        />
      );
    case "outdated":
      return (
        <ButtonV3
          variant="main"
          Icon={<Refresh size={20} />}
          style={{ padding: "100%", fontSize: 1 }}
          onClick={updateSyncState}
        />
      );
  }
};

type Props = {
  account: BitcoinAccount | TokenAccount;
};

type SyncState = {
  state: ZCashSyncState;
  progress: number;
};

const AccountBalanceSummaryFooter = ({ account }: Props) => {
  // TODO: retrieve initial sync state from the account data
  const initialSyncState: SyncState = {
    state: "disabled",
    progress: 0,
  };

  const [syncState, setSyncState] = useState<ZCashSyncState>(initialSyncState.state);
  const [progress, setProgress] = useState(initialSyncState.progress);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // TODO: Mocking progress. Delete this once we have a real progress.
  useEffect(() => {
    if (syncState === "running" && progress < 100) {
      const interval = setInterval(() => setProgress(progress + 1), 100);
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [syncState, progress]);

  useEffect(() => {
    if (syncState === "running" && progress === 100) {
      setSyncState("complete");
      setLastSync(new Date());
    }
  }, [syncState, progress]);

  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const zcashSyncStartNonce = useSelector(zcashSyncStartNonceSelector);
  const zcashSyncState = useSelector(zcashSyncStateSelector);
  const unit = useAccountUnit(account);
  const { getFeature } = useFeatureFlags();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  useEffect(() => {
    if (zcashSyncStartNonce > 0) {
      setProgress(0);
      setSyncState("running");
    }
  }, [zcashSyncStartNonce]);

  useEffect(() => {
    if (zcashSyncState === "ready") {
      setSyncState("ready");
    }
  }, [zcashSyncState]);

  const showPrivateBalanceComponent = getFeature("zcashShielded")?.enabled;

  const { spendableBalance } = account;
  const privateInfo = account.type === "Account" ? account.privateInfo : null;

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

  const _transparentBalance = spendableBalance ?? BigNumber(0);
  const _privateBalance = privateInfo?.balance ?? BigNumber(0);
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
        dispatch(startZcashSync());
        setSyncState("running");
        break;
      case "running":
        // Pause
        setSyncState("paused");
        break;
      case "paused":
        // Resume
        setSyncState("running");
        break;
      case "outdated":
        // Start sync from the last known block
        setSyncState("running");
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
      <BalanceDetail style={{ flexDirection: "row", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
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
        </div>
        <div style={{ display: "flex", paddingLeft: "30px" }}>
          {syncState !== "disabled" ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              {syncState === "running" ? <Spinner size={14} /> : null}
              {syncState === "paused" ? <Trans i18nKey="zcash.shielded.state.pausedAt" /> : null}
              {syncState === "complete" ? (
                <Trans
                  i18nKey="zcash.shielded.state.lastSync"
                  values={{ date: lastSync?.toLocaleString().replace(",", "") }}
                />
              ) : null}
              {(syncState === "running" || syncState === "paused") && progress < 100 ? (
                <Text style={{ paddingLeft: "5px", minWidth: "50px" }}>{progress}%</Text>
              ) : null}
            </div>
          ) : null}
          <div>
            <ActionButton t={t} syncState={syncState} updateSyncState={updateSyncState} />
          </div>
        </div>
      </BalanceDetail>
    </Wrapper>
  );
};

export default AccountBalanceSummaryFooter;
