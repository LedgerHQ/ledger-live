import React from "react";
import { Trans } from "react-i18next";
import { CeloAccount } from "@ledgerhq/live-common/families/celo/types";
import invariant from "invariant";
import CeloIcon from "./components/CeloIcon";
import { NavigatorName, ScreenName } from "../../const";

const getActions = ({ account }: { account: CeloAccount }) => {
  invariant(account, "celo account not found");
  const { celoResources } = account;
  invariant(celoResources, "celo resources not parsed");

  return [
    {
      disabled: false,
      navigationParams: [
        NavigatorName.CeloManageAssetsNavigator,
        {
          screen: ScreenName.CosmosDelegationStarted,
          params: {
            account,
          },
        },
      ],
      label: <Trans i18nKey="celo.manage.title" />,
      Icon: () => <CeloIcon isDisabled={false} />,
    },
  ];
};

export default {
  getActions,
};
