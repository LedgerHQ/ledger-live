import React from "react";
import { Trans } from "~/context/Locale";
import { IconsLegacy } from "@ledgerhq/native-ui";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { ActionButtonEvent } from "~/components/FabActions";

const getMainActions = ({ account: _account }: { account: AleoAccount }): ActionButtonEvent[] => {
  return [
    {
      id: "public_to_private",
      label: <Trans i18nKey="aleo.accountActions.publicToPrivate" />,
      Icon: IconsLegacy.TransferMedium,
      event: "button_clicked",
      eventProperties: {
        button: "public_to_private",
        currency: "ALEO",
        page: "Account Page",
      },
      // TODO: handler, for now empty skeleton only ( https://ledgerhq.atlassian.net/browse/LIVE-30501 )
      customHandler: () => {},
    },
  ];
};

export default {
  getMainActions,
};
