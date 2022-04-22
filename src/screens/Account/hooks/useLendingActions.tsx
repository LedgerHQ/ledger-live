/* @flow */
import React from "react";
import type { AccountLike } from "@ledgerhq/live-common/lib/types";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account";
import { Trans } from "react-i18next";
import { getAccountCapabilities } from "@ledgerhq/live-common/lib/compound/logic";
import { NavigatorName, ScreenName } from "../../../const";
import Plus from "../../../icons/Plus";
import Supply from "../../../icons/Supply";
import Withdraw from "../../../icons/Withdraw";

type Props = {
  account: AccountLike,
};

export default function AccountActions({ account }: Props) {
  const currency = getAccountCurrency(account);

  const availableOnCompound =
    account.type === "TokenAccount" && !!account.compoundBalance;
  const compoundCapabilities: any = availableOnCompound
    ? account.type === "TokenAccount" && getAccountCapabilities(account)
    : {};

  const lendingActions = !availableOnCompound
    ? []
    : [
        {
          navigationParams: [
            NavigatorName.LendingEnableFlow,
            {
              screen: ScreenName.LendingEnableAmount,
              params: {
                accountId: account.id,
                parentId: account.type === "TokenAccount" && account.parentId,
                currency,
              },
            },
          ],
          label: (
            <Trans
              i18nKey="transfer.lending.accountActions.approve"
              values={{ currency: currency.name }}
            />
          ),
          Icon: Plus,
          event: "Lend Approve Manage Account",
          eventProperties: { currencyName: currency.name },
        },
        {
          navigationParams: [
            NavigatorName.LendingSupplyFlow,
            {
              screen: ScreenName.LendingSupplyAmount,
              params: {
                accountId: account.id,
                parentId: account.type === "TokenAccount" && account.parentId,
                currency,
              },
            },
          ],
          label: (
            <Trans
              i18nKey="transfer.lending.accountActions.supply"
              values={{ currency: currency.name }}
            />
          ),
          Icon: Supply,
          event: "Lend Supply Manage Account",
          eventProperties: { currencyName: currency.name },
          disabled: !compoundCapabilities || !compoundCapabilities.canSupply,
        },
        {
          navigationParams: [
            NavigatorName.LendingWithdrawFlow,
            {
              screen: ScreenName.LendingWithdrawAmount,
              params: {
                accountId: account.id,
                parentId: account.type === "TokenAccount" && account.parentId,
                currency,
              },
            },
          ],
          label: (
            <Trans
              i18nKey="transfer.lending.accountActions.withdraw"
              values={{ currency: currency.name }}
            />
          ),
          Icon: Withdraw,
          event: "Lend Withdraw Manage Account",
          eventProperties: { currencyName: currency.name },
          disabled: !compoundCapabilities || !compoundCapabilities.canWithdraw,
        },
      ];

  return lendingActions;
}
