import React from "react";
import { Box, Tag, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { resolveContactAddressIconProps } from "../../model/resolveContactAddressIcon";
import type { ContactAddressDetailDialogProps } from "./types";
import { ContactAddressDetailQrCode } from "./ContactAddressDetailQrCode.native";

type ContactAddressDetailSummaryProps = Readonly<{
  row: NonNullable<ContactAddressDetailDialogProps["row"]>;
  network: NonNullable<ContactAddressDetailDialogProps["network"]>;
}>;

export function ContactAddressDetailSummary({
  row,
  network,
}: ContactAddressDetailSummaryProps): React.JSX.Element {
  const { t } = useTranslation();
  const iconProps = resolveContactAddressIconProps(row.currencyId, row.label, network.networkId);

  return (
    <Box lx={{ alignItems: "center", gap: "s32" }}>
      <ContactAddressDetailQrCode address={row.address} iconProps={iconProps} />
      <Box lx={{ alignItems: "center", gap: "s8" }}>
        <Tag
          appearance="base"
          size="md"
          label={t("contacts.addressDetail.networkTag", { name: network.networkName })}
          testID="contacts-address-detail-network-tag"
        />
        <Box lx={{ alignItems: "center", gap: "s4" }}>
          <Text typography="heading3SemiBold" lx={{ color: "base", textAlign: "center" }}>
            {row.label}
          </Text>
          <Text
            typography="body2"
            lx={{ color: "muted", textAlign: "center" }}
            testID="contacts-address-detail-full-address"
          >
            {row.address}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
