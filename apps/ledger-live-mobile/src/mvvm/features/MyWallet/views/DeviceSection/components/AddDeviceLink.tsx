import React from "react";
import { Box, Link } from "@ledgerhq/lumen-ui-rnative";
import { PlusCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";

type AddDeviceLinkProps = {
  readonly onPress: () => void;
};

export function AddDeviceLink({ onPress }: AddDeviceLinkProps) {
  const { t } = useTranslation();

  return (
    <Box
      lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}
      testID="my-wallet-device-section-add"
    >
      <Link appearance="accent" size="md" underline={false} onPress={onPress}>
        {t("myWallet.deviceSection.add")}
      </Link>
      <PlusCircleFill size={20} color="interactive" />
    </Box>
  );
}
