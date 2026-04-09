import React from "react";
import { Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import { ConsentFooter } from "./ConsentFooter";

type TwoCtaConsentSheetProps = Readonly<{
  title: string;
  description: React.ReactNode;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  privacyPolicyUrl: string;
}>;

export function TwoCtaConsentSheet({
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  privacyPolicyUrl,
}: TwoCtaConsentSheetProps) {
  return (
    <Box lx={{ width: "full" }}>
      <Box lx={{ width: "full", gap: "s32", paddingBottom: "s16" }}>
        <Box lx={{ width: "full", gap: "s24", alignItems: "center" }}>
          <Spot appearance="icon" icon={LedgerLogo} size={72} />
          <Box lx={{ width: "full", gap: "s8", alignItems: "center" }}>
            <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center", width: "full" }}>
              {title}
            </Text>
            {description}
          </Box>
        </Box>
        <Box lx={{ width: "full", gap: "s16" }}>
          <Button
            appearance="base"
            size="lg"
            lx={{ width: "full" }}
            accessibilityLabel={primaryLabel}
            onPress={onPrimary}
          >
            {primaryLabel}
          </Button>
          <Button
            appearance="gray"
            size="lg"
            lx={{ width: "full" }}
            accessibilityLabel={secondaryLabel}
            onPress={onSecondary}
          >
            {secondaryLabel}
          </Button>
        </Box>
      </Box>
      <Box lx={{ width: "full", paddingBottom: "s24" }}>
        <ConsentFooter privacyPolicyUrl={privacyPolicyUrl} />
      </Box>
    </Box>
  );
}
