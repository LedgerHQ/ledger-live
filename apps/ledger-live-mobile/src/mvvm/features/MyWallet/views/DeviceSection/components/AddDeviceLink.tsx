import React from "react";
import { Pressable, Text } from "@ledgerhq/lumen-ui-rnative";
import { PlusCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";

type AddDeviceLinkProps = {
  readonly onPress: () => void;
};

export function AddDeviceLink({ onPress }: AddDeviceLinkProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}
      onPress={onPress}
      testID="my-wallet-device-section-add"
    >
      <PlusCircleFill size={20} color="interactive" />
      <Text typography="body2SemiBold" lx={{ color: "active" }}>
        {t("myWallet.deviceSection.add")}
      </Text>
    </Pressable>
  );
}
