import React from "react";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { MinaAccount } from "@ledgerhq/live-common/families/mina/types";

import { IconsLegacy } from "@ledgerhq/native-ui";
import { Trans } from "~/context/Locale";
import type { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";

const getMainActions = ({
  account,
  parentAccount,
}: {
  account: MinaAccount;
  parentAccount: Account;
}): ActionButtonEvent[] => {
  const mainAccount = getMainAccount<MinaAccount>(account, parentAccount);
  const hasDelegation = mainAccount.resources?.stakingActive;

  const navigationParams: NavigationParamsType = [
    NavigatorName.MinaStakingFlow,
    {
      screen: ScreenName.MinaStakingValidator,
      params: {
        accountId: mainAccount.id,
      },
    },
  ];

  return [
    {
      id: "stake",
      navigationParams,
      label: hasDelegation ? (
        <Trans i18nKey="mina.accountHeaderManageActions.changeDelegation" />
      ) : (
        <Trans i18nKey="mina.accountHeaderManageActions.earn" />
      ),
      Icon: IconsLegacy.CoinsMedium,
      eventProperties: {
        currency: "MINA",
      },
    },
  ];
};

export default {
  getMainActions,
};
