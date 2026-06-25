import React from "react";
import { Trans } from "~/context/Locale";
import { IconsLegacy } from "@ledgerhq/native-ui";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { ActionButtonEvent } from "~/components/FabActions";

const getMainActions = ({ account }: { account: AleoAccount }): ActionButtonEvent[] => {
  return [
    {
      id: "publicToPrivate",
      label: <Trans i18nKey="aleo.accountActions.publicToPrivate" />,
      Icon: IconsLegacy.TransferMedium,
      event: "button_clicked",
      eventProperties: {
        button: "public_to_private",
        currency: "ALEO",
        page: "Account Page",
      },
      customHandler: () => {
        console.log("[Aleo] Public to Private button pressed, account:", account.id);
      },
    },
  ];
};

export default {
  getMainActions,
};
