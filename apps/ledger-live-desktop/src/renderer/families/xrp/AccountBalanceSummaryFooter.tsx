import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { IconButton, Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { Information, PenEdit } from "@ledgerhq/lumen-ui-react/symbols";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getParentAccount } from "@ledgerhq/live-common/account/helpers";
import { isMaxTrustLimitValue } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { formatLongTrustLimit, getXrpResources, hasTokenStandardEnabled } from "./utils";

const AccountBalanceSummaryFooter = ({ account }: { account: Account | TokenAccount }) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const allAccounts = useSelector(accountsSelector);
  const unit = useAccountUnit(account);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  if (account.type !== "TokenAccount") return null;

  const parentAccount = getParentAccount(account, allAccounts);
  const xrpResources = getXrpResources(account);
  const limit = xrpResources?.limit;
  if (!limit || !hasTokenStandardEnabled(parentAccount)) return null;

  const onEditSettings = () => {
    dispatch(openModal("MODAL_XRP_ADD_TOKEN", { account: parentAccount, tokenAccount: account }));
  };

  const editLabel = t("xrp.tokenAccount.editSettings");

  const formattedLimit = isMaxTrustLimitValue(limit)
    ? t("xrp.addToken.steps.settings.maximum")
    : (formatLongTrustLimit(limit, unit, locale) ??
      formatCurrencyUnit(unit, limit, { discreet, locale, showCode: true }));

  return (
    <div className="mt-20 flex items-center border-t border-muted-subtle px-32 pt-32">
      <div className="flex flex-[0.125_0_auto] flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="body-2 text-muted">
            <Trans i18nKey="xrp.tokenAccount.trustLimit" />
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-help text-muted">
                <Information size={12} />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <Trans i18nKey="xrp.tokenAccount.trustLimitTooltip" />
            </TooltipContent>
          </Tooltip>
        </div>
        <span className="heading-5-semi-bold text-base">
          <Discreet>{formattedLimit}</Discreet>
        </span>
      </div>
      <div className="flex flex-[0.125_0_auto] flex-col gap-4">
        <span className="body-2 text-muted">
          <Trans i18nKey="xrp.rippling.label" />
        </span>
        <span className="heading-5-semi-bold text-base">
          <Trans i18nKey={xrpResources.isRippling ? "xrp.rippling.on" : "xrp.rippling.off"} />
        </span>
      </div>
      <div className="ml-auto">
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
      </div>
    </div>
  );
};

export default AccountBalanceSummaryFooter;
