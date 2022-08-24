import React from "react";
import { Flex, Text, Icon } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { KYCStatus } from "@ledgerhq/live-common/exchange/swap/types";

const statusThemeMap = {
  pending: {
    color: "warning.c100",
    backgroundColor: "warning.c10",
    icon: "Clock",
  },
  approved: {
    color: "success.c100",
    backgroundColor: "success.c10",
    icon: "CircledCheck",
  },
  closed: {
    color: "error.c100",
    backgroundColor: "error.c10",
    icon: "Info",
  },
  upgradeRequired: {
    color: "warning.c100",
    backgroundColor: "warning.c10",
    icon: "Clock",
  },
};

export function StatusTag({ kyc }: { kyc?: KYCStatus }) {
  const { t } = useTranslation();

  if (!kyc?.status) {
    return null;
  }

  // @ts-expect-error something wrong with statusThemeMap
  const { color, backgroundColor, icon } = statusThemeMap[kyc.status] || {
    color: null,
    backgroundColor: null,
    icon: null,
  };

  // TODO swap: replace with Tag component
  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      borderRadius={4}
      padding={2}
      marginRight={2}
      backgroundColor={backgroundColor}
    >
      <Flex marginRight={2} borderRadius={4}>
        <Text variant="tiny" color={color}>
          {t(`transfer.swap2.form.providers.kyc.status.${kyc.status}`)}
        </Text>
      </Flex>
      <Icon size={12} color={color} name={icon} />
    </Flex>
  );
}
