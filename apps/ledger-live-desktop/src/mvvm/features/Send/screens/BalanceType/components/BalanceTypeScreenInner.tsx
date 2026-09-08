import React from "react";
import styled from "styled-components";
import { Trans } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector } from "~/renderer/reducers/settings";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import Alert from "~/renderer/components/Alert";
import type {
  BalanceSender,
  BalanceTypeScreenViewModel,
} from "../hooks/useBalanceTypeScreenViewModel";

type ReadyViewModel = Extract<BalanceTypeScreenViewModel, { ready: true }>;

type Props = {
  viewModel: ReadyViewModel;
};

const Card = styled(Box).attrs(() => ({
  flex: "1 1 0",
  p: 3,
}))<{ $active: boolean }>`
  appearance: none;
  width: 100%;
  font: inherit;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid ${p => (p.$active ? p.theme.colors.primary.c80 : p.theme.colors.neutral.c40)};
  background-color: ${p => (p.$active ? p.theme.colors.primary.c10 : p.theme.colors.neutral.c00)};

  &:focus-visible {
    outline: 2px solid ${p => p.theme.colors.primary.c80};
    outline-offset: 2px;
  }
`;

const CardTitle = styled(Text).attrs(() => ({
  ff: "Inter|SemiBold",
  fontSize: 4,
  color: "neutral.c100",
}))``;

const CardSubtitle = styled(Text).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 3,
  color: "neutral.c70",
}))``;

const CardAmount = styled(Text).attrs(() => ({
  ff: "Inter|Medium",
  fontSize: 3,
  color: "neutral.c80",
}))``;

const ZeroBalanceWarning = styled(Text).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 2,
  color: "warning.c70",
}))``;

export function BalanceTypeScreenInner({ viewModel }: Props) {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(viewModel.account);

  const { selectedSender, transparentOption, shieldedOption, onSelect } = viewModel;

  const formatConfig = { showCode: true, discreet, locale };
  const transparentLabel = formatCurrencyUnit(unit, transparentOption.balance, formatConfig);
  const shieldedLabel = formatCurrencyUnit(unit, shieldedOption.balance, formatConfig);

  const handleSelect = (sender: BalanceSender) => {
    onSelect(sender);
  };

  return (
    <Box flow={3} className="p-24" data-testid="balance-type-screen">
      <Box horizontal flow={3}>
        <Card
          as="button"
          type="button"
          $active={selectedSender === "public"}
          aria-pressed={selectedSender === "public"}
          onClick={() => handleSelect("public")}
          data-testid="balance-type-transparent"
        >
          <CardTitle>
            <Trans i18nKey="newSendFlow.balanceType.transparent.title" />
          </CardTitle>
          <CardSubtitle>
            <Trans i18nKey="newSendFlow.balanceType.transparent.subtitle" />
          </CardSubtitle>
          <CardAmount>
            <Discreet>{transparentLabel}</Discreet>
          </CardAmount>
          {transparentOption.balance.isZero() ? (
            <ZeroBalanceWarning data-testid="balance-type-transparent-zero">
              <Trans i18nKey="newSendFlow.balanceType.zeroBalance.warning" />
            </ZeroBalanceWarning>
          ) : null}
        </Card>

        <Card
          as="button"
          type="button"
          $active={selectedSender === "private"}
          aria-pressed={selectedSender === "private"}
          onClick={() => handleSelect("private")}
          data-testid="balance-type-shielded"
        >
          <CardTitle>
            <Trans i18nKey="newSendFlow.balanceType.shielded.title" />
          </CardTitle>
          <CardSubtitle>
            <Trans i18nKey="newSendFlow.balanceType.shielded.subtitle" />
          </CardSubtitle>
          <CardAmount>
            <Discreet>{shieldedLabel}</Discreet>
          </CardAmount>
          {shieldedOption.balance.isZero() ? (
            <ZeroBalanceWarning data-testid="balance-type-shielded-zero">
              <Trans i18nKey="newSendFlow.balanceType.zeroBalance.warning" />
            </ZeroBalanceWarning>
          ) : null}
        </Card>
      </Box>
      {shieldedOption.hasMaturingNotes ? (
        <Alert type="warning" mt={3} data-testid="balance-type-maturing-notice">
          <Trans i18nKey="newSendFlow.balanceType.shielded.maturingNotice" />
        </Alert>
      ) : null}
    </Box>
  );
}
