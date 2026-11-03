import React from "react";
import styled from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getParentAccount } from "@ledgerhq/live-common/account/helpers";
import { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Alert from "~/renderer/components/Alert";
import Box, { Tabbable } from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ToolTip from "~/renderer/components/Tooltip";
import InfoCircle from "~/renderer/icons/InfoCircle";
import IconPen from "~/renderer/icons/Pen";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

// A limit of 0 is often set from another wallet: the line then stays until its balance is 0
const AccountBalanceSummaryFooter = ({ account }: { account: Account | TokenAccount }) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const allAccounts = useSelector(accountsSelector);
  const unit = useAccountUnit(account);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  if (account.type !== "TokenAccount") return null;

  const openTokenModal = (action?: "edit") => {
    const parentAccount = getParentAccount(account, allAccounts);
    const tokenParams = action ? { tokenAccount: account, action } : {};
    dispatch(openModal("MODAL_XRP_ADD_TOKEN", { account: parentAccount, ...tokenParams }));
  };

  // The generic bridge keeps a removed token's account, at 0, for its history
  const { xrpResources } = account as XrpTokenAccount;
  if (!xrpResources) {
    return (
      <Alert
        type="primary"
        mx={5}
        mt={4}
        title={<Trans i18nKey="xrp.tokenAccount.removed.title" />}
        learnMoreLabel={<Trans i18nKey="xrp.tokenAccount.removed.addAgain" />}
        learnMoreIsInternal
        onLearnMore={() => openTokenModal()}
      >
        <Trans
          i18nKey="xrp.tokenAccount.removed.description"
          values={{ token: account.token.name }}
        />
      </Alert>
    );
  }

  const { limit, isLocked, isRippling } = xrpResources;
  if (!limit && !isLocked) return null;

  const formattedLimit = limit
    ? formatCurrencyUnit(unit, limit, { showCode: true, discreet, locale })
    : null;

  return (
    <Box>
      {formattedLimit ? (
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
            <Box horizontal alignItems="center">
              <AmountValue>
                <Discreet>{formattedLimit}</Discreet>
              </AmountValue>
              <ToolTip content={t("xrp.tokenAccount.editLimit")}>
                <EditButton
                  onClick={() => openTokenModal("edit")}
                  data-testid="xrp-edit-trust-limit"
                >
                  <IconPen size={14} />
                </EditButton>
              </ToolTip>
            </Box>
          </BalanceDetail>
        </Wrapper>
      ) : null}
      {limit?.isZero() ? (
        <Alert
          type="warning"
          mx={5}
          mt={4}
          title={<Trans i18nKey="xrp.tokenAccount.limitZero.title" />}
        >
          <Trans
            i18nKey="xrp.tokenAccount.limitZero.description"
            values={{ token: account.token.name }}
          />
        </Alert>
      ) : null}
      {isRippling ? (
        <Alert
          type="warning"
          mx={5}
          mt={4}
          title={<Trans i18nKey="xrp.tokenAccount.rippling.title" />}
        >
          <Trans
            i18nKey="xrp.tokenAccount.rippling.description"
            values={{ token: account.token.name }}
          />
        </Alert>
      ) : null}
      {isLocked ? (
        <Alert
          type="warning"
          mx={5}
          mt={4}
          title={<Trans i18nKey="xrp.tokenAccount.locked.title" />}
        >
          <Trans i18nKey="xrp.tokenAccount.locked.description" />
        </Alert>
      ) : null}
    </Box>
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

const EditButton = styled(Tabbable).attrs(() => ({
  alignItems: "center",
  justifyContent: "center",
  ml: 2,
  p: 1,
  color: "neutral.c70",
}))`
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    color: ${p => p.theme.colors.neutral.c100};
  }
`;

const AmountValue = styled(Text).attrs(() => ({
  fontSize: 6,
  ff: "Inter|SemiBold",
  color: "neutral.c100",
}))``;

export default AccountBalanceSummaryFooter;
