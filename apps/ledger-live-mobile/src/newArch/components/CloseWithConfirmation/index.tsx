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
      {...(onClose && { onClose })}
      {...(showButton && { showButton })}
      {...(buttonText && { buttonText })}
      customDrawerStyle={{
        title: {
          textAlign: "left",
          fontSize: 18,
          fontWeight: 600,
          lineHeight: 32.4,
          letterSpacing: -0.72,
          marginBottom: 16,
          marginTop: -45,
        },
      }}
      cancelCTAConfig={{
        type: "primary",
        outline: true,
      }}
      confirmButtonText={<Trans i18nKey="addAccounts.quitConfirmation.v2.cancel" />}
      rejectButtonText={<Trans i18nKey="addAccounts.quitConfirmation.v2.continue" />}
    />
  );
}
