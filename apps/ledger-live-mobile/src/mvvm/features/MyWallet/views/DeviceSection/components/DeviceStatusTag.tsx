import React from "react";
import { Box, Tag, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

type DeviceStatusTagProps = {
  readonly available: boolean;
};

export function DeviceStatusTag({ available }: DeviceStatusTagProps) {
  const { t } = useTranslation();

  if (available) {
    return <ActiveTag label={t("myWallet.deviceSection.available")} />;
  }

  return <Tag label={t("myWallet.deviceSection.unavailable")} size="sm" appearance="gray" />;
}

/**
 * Custom tag using `bg.activeSubtle` + `text.active` tokens.
 * The Lumen `Tag` component doesn't expose an "active" appearance variant,
 * so we replicate its layout (xs radius, s4/s2 padding, body4 typo) manually.
 */
function ActiveTag({ label }: { readonly label: string }) {
  return (
    <Box
      lx={{
        backgroundColor: "activeSubtle",
        borderRadius: "xs",
        paddingHorizontal: "s4",
        paddingVertical: "s2",
      }}
    >
      <Text typography="body4" lx={{ color: "active" }}>
        {label}
      </Text>
    </Box>
  );
}
