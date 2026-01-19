import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { Trans, useTranslation } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import ButtonV3 from "~/renderer/components/ButtonV3";
import BigNumber from "bignumber.js";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { useFeatureFlags } from "@ledgerhq/live-common/featureFlags/index";
import { openModal } from "~/renderer/actions/modals";
import type { BitcoinFamily } from "./types";
import type { Currency } from "@ledgerhq/coin-bitcoin/wallet-btc/index";
import { Pause, Refresh } from "@ledgerhq/lumen-ui-react/symbols";
import Spinner from "~/renderer/components/Spinner";
import { TFunction } from "i18next";

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

type ZCashSyncState = "disabled" | "running" | "paused" | "complete" | "outdated";

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
    case "paused":
      return (
        <ButtonV3
          variant="main"
          Icon={<Refresh size={20} />}
          style={{ padding: "100%" }}
          onClick={updateSyncState}
        />
      );
    case "running":
      return (
        <ButtonV3
          variant="main"
          Icon={<Pause size={20} />}
          style={{ padding: "100%" }}
          onClick={updateSyncState}
        />
      );
    case "outdated":
      return (
        <ButtonV3
          variant="main"
          Icon={<Refresh size={20} />}
          style={{ padding: "100%" }}
          onClick={updateSyncState}
        />
      );
  }
};

const AccountBalanceSummaryFooter: BitcoinFamily["AccountBalanceSummaryFooter"] = ({ account }) => {
  const [syncState, setSyncState] = useState<ZCashSyncState>("disabled"); // TODO: initial state depends on the account data
  const [progress] = useState(0);

  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const { getFeature } = useFeatureFlags();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const showComponent = getFeature("zcashShielded");

  const { spendableBalance } = account;
  const privateInfo = account.type === "Account" ? account.privateInfo : null;

  useEffect(() => {
    if (privateInfo?.key && syncState === "disabled") {
      setSyncState("running");
    }
  }, [privateInfo, syncState]);

  if (
    account.type !== "Account" ||
    (account.currency.id as Currency) !== "zcash" ||
    !showComponent?.enabled
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
      case "running":
        // Pause block processing task
        setSyncState("paused");
        break;
      case "paused":
        // Resume block processing task
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
              {syncState === "paused" ? <Text>Paused at </Text> : null}
              <Text style={{ paddingLeft: "3px", paddingRight: "10px" }}>{progress}%</Text>
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
