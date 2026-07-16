import React from "react";
import { Trans } from "~/context/Locale";
import { Text } from "@ledgerhq/lumen-ui-rnative";

interface PrivacyPolicyLinkProps {
  onPrivacyPolicyPress: () => void;
}

const PrivacyPolicyLink = ({ onPrivacyPolicyPress }: PrivacyPolicyLinkProps) => {
  return (
    <Text typography="body3" lx={{ color: "muted", textAlign: "center" }}>
      <Trans
        i18nKey="analyticsConsent.privacyPolicy"
        components={{
          PrivacyPolicy: (
            <Text
              typography="body3"
              onPress={onPrivacyPolicyPress}
              accessibilityRole="link"
              style={{ textDecorationLine: "underline" }}
            />
          ),
        }}
      />
    </Text>
  );
};

export default PrivacyPolicyLink;
