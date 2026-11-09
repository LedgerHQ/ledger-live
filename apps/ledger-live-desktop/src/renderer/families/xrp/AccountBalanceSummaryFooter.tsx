import React from "react";
import styled from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import { IconButton, Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { PenEdit } from "@ledgerhq/lumen-ui-react/symbols";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getParentAccount } from "@ledgerhq/live-common/account/helpers";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import InfoCircle from "~/renderer/icons/InfoCircle";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { hasTokenStandardEnabled } from "./hasTokenStandardEnabled";

const AccountBalanceSummaryFooter = ({ account }: { account: Account | TokenAccount }) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const allAccounts = useSelector(accountsSelector);
  const unit = useAccountUnit(account);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  if (account.type !== "TokenAccount") return null;

  const parentAccount = getParentAccount(account, allAccounts);
  const xrpResources = (account as XrpTokenAccount).xrpResources;
  const limit = xrpResources?.limit;
  if (!limit || !hasTokenStandardEnabled(parentAccount)) return null;

  const onEditSettings = () => {
    dispatch(openModal("MODAL_XRP_ADD_TOKEN", { account: parentAccount, tokenAccount: account }));
  };

  const editLabel = t("xrp.tokenAccount.editSettings");

  return (
    <Wrapper>
      <BalanceDetail>
        <ToolTip content={<Trans i18nKey="xrp.tokenAccount.trustLimitTooltip" />}>
          <TitleWrapper>
            <Title>
              <Trans i18nKey="xrp.tokenAccount.trustLimit" />
            </Title>
            <InfoCircle size={13} />
          </TitleWrapper>
        </ToolTip>
        <AmountValue>
          <Discreet>
            {formatCurrencyUnit(unit, limit, { showCode: true, discreet, locale })}
          </Discreet>
        </AmountValue>
      </BalanceDetail>
      <BalanceDetail>
        <TitleWrapper>
          <Title>
            <Trans i18nKey="xrp.rippling.label" />
          </Title>
        </TitleWrapper>
        <AmountValue>
          <Trans i18nKey={xrpResources.isRippling ? "xrp.rippling.on" : "xrp.rippling.off"} />
        </AmountValue>
      </BalanceDetail>
      <Box horizontal alignItems="center" ml="auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton
              appearance="gray"
              size="sm"
              icon={PenEdit}
              className="border border-muted"
              aria-label={editLabel}
              onClick={onEditSettings}
              data-testid="xrp-edit-token-settings"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">{editLabel}</TooltipContent>
        </Tooltip>
      </Box>
    </Wrapper>
  );
};

const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  mt: 4,
  p: 5,
  pb: 0,
}))`
  border-top: 1px solid ${p => p.theme.colors.neutral.c30};
`;

const BalanceDetail = styled(Box).attrs(() => ({
  flex: "0.125 0 auto",
  alignItems: "start",
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
}))``;

export default AccountBalanceSummaryFooter;
