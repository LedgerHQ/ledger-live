import React from "react";
import styled from "styled-components";
import { useSelector } from "LLD/hooks/redux";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import { MinaFamily } from "./types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { CopiableField } from "./CopiableField";
import { Trans, useTranslation } from "react-i18next";

const Wrapper = styled(Box).attrs(() => ({
  vertical: true,
  mt: 4,
}))`
  border-top: 1px solid ${p => p.theme.colors.neutral.c30};
`;

const DetailsWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  p: 5,
  pb: 0,
  scroll: true,
}))``;

const BalanceDetail = styled(Box).attrs(() => ({
  flex: "0.33 0 auto",
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

const AccountBalanceSummaryFooter: MinaFamily["AccountBalanceSummaryFooter"] = ({ account }) => {
  const { t } = useTranslation();
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);

  if (account.type !== "Account") return null;

  const hasDelegation = account.resources?.stakingActive;
  if (!hasDelegation) return null;

  const stakedBalance = formatCurrencyUnit(unit, account.balance, {
    discreet,
    locale,
    showCode: true,
  });

  return (
    <Wrapper>
      <DetailsWrapper>
        <BalanceDetail>
          <ToolTip content={t("mina.summaryFooter.delegatedToTooltip")}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="mina.summaryFooter.delegatedTo" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <Text>{account.resources?.delegateInfo?.identityName}</Text>
        </BalanceDetail>

        <BalanceDetail>
          <ToolTip content={t("mina.summaryFooter.stakedBalanceTooltip")}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="mina.summaryFooter.stakedBalance" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <Text>
            <Discreet>{stakedBalance}</Discreet>
          </Text>
        </BalanceDetail>

        <BalanceDetail>
          <ToolTip content={t("mina.summaryFooter.producerAddressTooltip")}>
            <TitleWrapper>
              <Title>
                <Trans i18nKey="mina.summaryFooter.producerAddress" />
              </Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <CopiableField value={account.resources?.delegateInfo?.address ?? ""}>
            <Text>{account.resources?.delegateInfo?.address}</Text>
          </CopiableField>
        </BalanceDetail>
      </DetailsWrapper>
    </Wrapper>
  );
};

export default AccountBalanceSummaryFooter;
