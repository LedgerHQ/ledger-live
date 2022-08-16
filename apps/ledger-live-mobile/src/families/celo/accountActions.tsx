import React from "react";
import type { Account } from "@ledgerhq/live-common/types/index";
// import { canDelegate } from "@ledgerhq/live-common/families/osmosis/logic";

import { Icons } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { NavigatorName, ScreenName } from "../../const";

const getActions = ({ account }: { account: Account }) => {
//   const delegationDisabled = !canDelegate(account);

  return [
    {
      disabled: false,
      navigationParams: [
        NavigatorName.CeloRegisterAccountFlow,
        {
          screen: ScreenName.CeloRegisterAccountStarted,
        },
      ],
      label: "Register",
      Icon: Icons.LinkMedium,
    },
  ];
};

export default {
  getActions,
};
