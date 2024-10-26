import React from "react";
import { Trans } from "react-i18next";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { CryptoOrgAccount } from "@ledgerhq/live-common/families/crypto_org/types";
import { ScreenName } from "~/const";
import { ActionButtonEvent, NavigationParamsType } from "~/components/FabActions";

const getMainActions = ({ account }: { account: CryptoOrgAccount }): ActionButtonEvent[] => {
  const navigationParams: NavigationParamsType = [
    ScreenName.PlatformApp,
    {
      params: {
        platform: "stakekit",
        name: "StakeKit",
        accountId: account.id,
        yieldId: "cronos-cro-native-staking",
      },
    },
  ];

  return [
    {
      id: "stake",
      navigationParams,
      label: <Trans i18nKey="account.stake" />,
      Icon: IconsLegacy.CoinsMedium,
    },
  ];
};

export default {
  getMainActions,
};
