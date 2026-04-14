import React from "react";
import { Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { PrivacyDescription } from "./PrivacyDescription";

type PrivacyUpdateSheetProps = Readonly<{
  privacyPolicyUrl: string;
  onGotIt: () => void;
}>;

export function PrivacyUpdateSheet({ privacyPolicyUrl, onGotIt }: PrivacyUpdateSheetProps) {
  const { t } = useTranslation();

  return (
    <Box lx={{ width: "full" }}>
      <Box lx={{ width: "full", gap: "s32", paddingBottom: "s12" }}>
        <Box lx={{ width: "full", gap: "s24", alignItems: "center" }}>
          <Spot appearance="info" size={72} />
          <Box lx={{ width: "full", gap: "s8", alignItems: "center" }}>
            <Text
              typography="heading4SemiBold"
              lx={{ color: "base", textAlign: "center", width: "full" }}
            >
              {t("analyticsConsentDrawer.privacy.title")}
            </Text>
            <PrivacyDescription privacyPolicyUrl={privacyPolicyUrl} />
          </Box>
        </Box>
        <Button appearance="base" size="lg" lx={{ width: "full" }} onPress={onGotIt}>
          {t("analyticsConsentDrawer.privacy.ctaGotIt")}
        </Button>
      </Box>
    </Box>
  );
}
