import React from "react";
import { Trans } from "~/context/Locale";
import { IconsLegacy } from "@ledgerhq/native-ui";
import { useToasts } from "~/components/Toast";
import type { Account } from "@ledgerhq/types-live";

type Props = {
  account: Account;
  parentAccount?: Account;
};

export default function AccountHeaderActions({ account }: Props) {
  const { showToast } = useToasts();

  const handleConvertPress = () => {
    // UI only - show "Coming soon" toast
    showToast({
      type: "info",
      title: "Coming soon",
      text: "Self-transfer feature will be available in a future update",
    });
  };

  return [
    {
      id: "convert_balance",
      label: <Trans i18nKey="aleo.convertBalance" />,
      Icon: IconsLegacy.ArrowsUpDownMedium,
      onPress: handleConvertPress,
      event: "button_clicked",
      eventProperties: {
        button: "convert_balance",
        currency: account.currency.id,
      },
    },
  ];
}
