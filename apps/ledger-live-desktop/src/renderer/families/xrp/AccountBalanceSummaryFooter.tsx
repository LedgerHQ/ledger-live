import React from "react";
import { Trans } from "react-i18next";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ledgerhq/lumen-ui-react";
import { Information } from "@ledgerhq/lumen-ui-react/symbols";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getParentAccount } from "@ledgerhq/live-common/account/helpers";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { getXrpResources, hasTokenStandardEnabled } from "./utils";

const AccountBalanceSummaryFooter = ({ account }: { account: Account | TokenAccount }) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const allAccounts = useSelector(accountsSelector);
  const unit = useAccountUnit(account);

  if (account.type !== "TokenAccount") return null;

  const parentAccount = getParentAccount(account, allAccounts);
  const xrpResources = getXrpResources(account);
  const limit = xrpResources?.limit;
  if (!limit || !hasTokenStandardEnabled(parentAccount)) return null;

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
          <Discreet>
            {formatCurrencyUnit(unit, limit, { showCode: true, discreet, locale })}
          </Discreet>
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
    </div>
  );
};

export default AccountBalanceSummaryFooter;
