import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";

export default function CryptoAddressesErrorState() {
  const { t } = useTranslation();

  return (
    <Box lx={containerStyle}>
      <Text typography="body2" lx={{ color: "muted" }}>
        {t("cryptoAddresses.errorState")}
      </Text>
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  paddingVertical: "s32",
  alignItems: "center",
};
