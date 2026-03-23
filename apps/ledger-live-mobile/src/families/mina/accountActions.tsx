import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { MinaAccount } from "@ledgerhq/live-common/families/mina/types";
import React from "react";

import { IconsLegacy } from "@ledgerhq/native-ui";
import type { Account } from "@ledgerhq/types-live";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";
import { NavigatorName, ScreenName } from "~/const";
import { Trans } from "~/context/Locale";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";

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

  const label = getStakeLabelLocaleBased();

  return [
    {
      id: "stake",
      navigationParams,
      label: hasDelegation ? (
        <Trans i18nKey="mina.accountHeaderManageActions.changeDelegation" />
      ) : (
        <Trans i18nKey={label} />
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
