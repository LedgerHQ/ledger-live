import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { BigNumber } from "bignumber.js";
import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { useBalanceHistoryWithCountervalue } from "~/renderer/actions/portfolio";
import Box from "~/renderer/components/Box/Box";
import Discreet from "~/renderer/components/Discreet";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import InfoCircle from "~/renderer/icons/InfoCircle";
import {
  counterValueCurrencySelector,
  countervalueFirstSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { InternetComputerFamily } from "./types";

const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  mt: 4,
  p: 5,
  pb: 0,
  scroll: true,
}))`
  border-top: 1px solid ${p => p.theme.colors.palette.text.shade10};
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
  color: "palette.text.shade60",
}))`
  line-height: ${p => p.theme.space[4]}px;
  margin-right: ${p => p.theme.space[1]}px;
`;

const AmountValue = styled(Text).attrs(() => ({
  fontSize: 6,
  ff: "Inter|SemiBold",
  color: "palette.text.shade100",
}))``;

const Separator = styled.div`
  width: 1px;
  height: 40px;
  background-color: ${p => p.theme.colors.palette.text.shade10};
  margin: 0 10px;
  align-self: center;
`;

interface StakedBalanceCountervalue {
  stakedCountervalue: number;
  stakedValue: number;
  countervalueAvailable: boolean;
}

const useStakedBalanceCountervalue = (account: ICPAccount): StakedBalanceCountervalue | null => {
  const { history, countervalueAvailable } = useBalanceHistoryWithCountervalue({
    account,
    range: "day",
  });
  if (!account.neurons?.totalStaked) return null;
  const lastHistory = history.at(-1);
  if (!lastHistory?.countervalue || !lastHistory?.value) return null;
  const stakedRatio = account.neurons.totalStaked.div(account.balance);
  return {
    stakedCountervalue: lastHistory.countervalue * stakedRatio.toNumber(),
    stakedValue: lastHistory.value * stakedRatio.toNumber(),
    countervalueAvailable,
  };
};

const useCountervaluePreferences = () => {
  const countervalueFirst = useSelector(countervalueFirstSelector);
  return { countervalueFirst };
};

const AccountBalanceSummaryFooter: InternetComputerFamily["AccountBalanceSummaryFooter"] = ({
  account,
  discreetMode,
}) => {
  const { t } = useTranslation();

  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);
  const counterValue = useSelector(counterValueCurrencySelector);
  const { countervalueFirst } = useCountervaluePreferences();

  if (account.type !== "Account") return null;
  const icpAccount = account; // TokenAccount is not possible here
  const stakedCountervalue = useStakedBalanceCountervalue(icpAccount);
  const { neurons } = icpAccount;

  const formatConfig = {
    alwaysShowSign: false,
    showCode: false,
    discreet: discreetMode,
    locale,
  };

  const stakedBalance = formatCurrencyUnit(unit, neurons.totalStaked, {
    ...formatConfig,
    showCode: !countervalueFirst,
  });

  const stakedCountervalueFormatted = formatCurrencyUnit(
    counterValue.units[0],
    new BigNumber(stakedCountervalue?.stakedCountervalue ?? 0),
    {
      ...formatConfig,
      showCode: true,
    },
  );

  const maturityBalance = formatCurrencyUnit(
    unit,
    neurons.totalMaturity.plus(neurons.totalMaturityStaked),
    formatConfig,
  );
  const maturityStakedBalance = formatCurrencyUnit(unit, neurons.totalMaturityStaked, formatConfig);
  const maturityLiquidBalance = formatCurrencyUnit(unit, neurons.totalMaturity, formatConfig);

  const countervalueAvailable = stakedCountervalue?.countervalueAvailable;

  return (
    <Wrapper>
      <Box style={{ display: "flex", flexDirection: "row", gap: 30 }}>
        {neurons.totalStaked.gt(0) && (
          <BalanceDetail>
            <ToolTip content={t("internetComputer.summaryFooter.stakedBalanceTooltip")}>
              <TitleWrapper>
                <Title>{t("internetComputer.summaryFooter.stakedBalance")}</Title>
                <InfoCircle size={13} />
              </TitleWrapper>
            </ToolTip>
            <AmountValue>
              <Discreet>
                {countervalueFirst && countervalueAvailable && stakedCountervalueFormatted
                  ? stakedCountervalueFormatted
                  : stakedBalance}
              </Discreet>
            </AmountValue>
          </BalanceDetail>
        )}

        {neurons.totalStaked.gt(0) && neurons.totalMaturity.gt(0) && <Separator />}

        {neurons.totalMaturity.gt(0) && (
          <BalanceDetail>
            <ToolTip content={t("internetComputer.summaryFooter.totalMaturityTooltip")}>
              <TitleWrapper>
                <Title>{t("internetComputer.summaryFooter.totalMaturity")}</Title>
                <InfoCircle size={13} />
              </TitleWrapper>
            </ToolTip>
            <AmountValue>
              <Discreet>{maturityBalance}</Discreet>
            </AmountValue>
          </BalanceDetail>
        )}
        {neurons.totalMaturityStaked.gt(0) && (
          <BalanceDetail>
            <ToolTip content={t("internetComputer.summaryFooter.stakedMaturityTooltip")}>
              <TitleWrapper>
                <Title>{t("internetComputer.summaryFooter.stakedMaturity")}</Title>
                <InfoCircle size={13} />
              </TitleWrapper>
            </ToolTip>
            <AmountValue>
              <Discreet>{maturityStakedBalance}</Discreet>
            </AmountValue>
          </BalanceDetail>
        )}
        {neurons.totalMaturity.gt(0) && (
          <BalanceDetail>
            <ToolTip content={t("internetComputer.summaryFooter.liquidMaturityTooltip")}>
              <TitleWrapper>
                <Title>{t("internetComputer.summaryFooter.liquidMaturity")}</Title>
                <InfoCircle size={13} />
              </TitleWrapper>
            </ToolTip>
            <AmountValue>
              <Discreet>{maturityLiquidBalance}</Discreet>
            </AmountValue>
          </BalanceDetail>
        )}
      </Box>
      {neurons.fullNeurons.length > 0 && (
        <Box
          ff="Inter|SemiBold"
          margin={"auto 0 auto auto"}
          fontSize={4}
          color="palette.text.shade60"
        >
          {t("internetComputer.lastSynced")
            .concat(": ")
            .concat(new Date(neurons.lastUpdatedMSecs).toLocaleString())}
        </Box>
      )}
    </Wrapper>
  );
};

export default AccountBalanceSummaryFooter;
