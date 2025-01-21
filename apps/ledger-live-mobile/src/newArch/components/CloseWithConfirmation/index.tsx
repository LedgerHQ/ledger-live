import React from "react";
import { Trans } from "react-i18next";
import { useRoute } from "@react-navigation/native";
import { NavigationHeaderCloseButtonAdvanced } from "~/components/NavigationHeaderCloseButton";
import { ScreenName } from "~/const";

const routesWithConfirmation: string[] = [
  ScreenName.SelectDevice,
  ScreenName.SelectNetwork,
  ScreenName.AddAccountsSelectCrypto,
  ScreenName.ScanDeviceAccounts,
  ScreenName.NoAssociatedAccounts,
];
export default function CloseWithConfirmation({
  onClose,
  showButton,
  buttonText,
}: {
  onClose?: () => void;
  showButton?: boolean;
  buttonText?: string;
}) {
  const route = useRoute();
  return (
    <NavigationHeaderCloseButtonAdvanced
      withConfirmation={routesWithConfirmation.includes(route.name)}
      confirmationTitle={<Trans i18nKey="addAccounts.quitConfirmation.v2.title" />}
      confirmationDesc={<Trans i18nKey="addAccounts.quitConfirmation.v2.desc" />}
      {...(onClose && { onClose })}
      {...(showButton && { showButton })}
      {...(buttonText && { buttonText })}
      customDrawerStyle={{
        title: {
          textAlign: "left",
          fontSize: 24,
          fontWeight: 600,
          lineHeight: 32.4,
          letterSpacing: -0.72,
        },
        description: {
          textAlign: "left",
          paddingHorizontal: 0,
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 21,
        },
      }}
    />
  );
}
