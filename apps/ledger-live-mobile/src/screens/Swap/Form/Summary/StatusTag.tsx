import React from "react";
import { Flex, Text, Icon } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { KYCStatus } from "@ledgerhq/live-common/src/exchange/swap/types";

// TODO background color with opacity
const statusThemeMap = {
  pending: {
    color: "warning.c100",
    icon: "Clock",
  },
  approved: {
    color: "success.c100",
    icon: "CircledCheck",
  },
  closed: {
    color: "error.c100",
    icon: "Info",
  },
  upgradeRequired: {
    color: "warning.c100",
    icon: "Clock",
  },
};

export function StatusTag({ kyc }: { kyc?: KYCStatus }) {
  const { t } = useTranslation();

  if (!kyc) {
    return null;
  }

  // @ts-expect-error
  const { color, icon } = statusThemeMap[kyc.status] || {
    color: null,
    icon: null,
  };

  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      borderRadius={4}
      padding={2}
      marginRight={2}
    >
      <Flex marginRight={2}>
        <Text variant="small" color={color}>
          {t(`transfer.swap2.form.providers.kyc.status.${kyc.status}`)}
        </Text>
      </Flex>
      <Icon size={12} color={color} name={icon} />
    </Flex>
  );
}
