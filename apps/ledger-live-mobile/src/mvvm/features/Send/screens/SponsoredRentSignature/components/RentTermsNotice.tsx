import React from "react";
import { Linking } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { Trans } from "~/context/Locale";

type RentTermsNoticeProps = Readonly<{
  providerName: string;
  termsUrl: string;
}>;

type TermsLinkProps = Readonly<{
  children?: React.ReactNode;
  href: string;
}>;

function TermsLink({ children, href }: TermsLinkProps) {
  return (
    <Text
      typography="body2"
      lx={{ color: "muted", textDecorationLine: "underline" }}
      onPress={() => {
        void Linking.openURL(href);
      }}
      accessibilityRole="link"
      testID="send-sponsored-rent-signature-terms-link"
    >
      {children}
    </Text>
  );
}

/** The provider's terms, which signing the rent payment accepts. */
export function RentTermsNotice({ providerName, termsUrl }: RentTermsNoticeProps) {
  return (
    <Text
      typography="body2"
      lx={{ color: "muted", textAlign: "center", paddingHorizontal: "s16" }}
      testID="send-sponsored-rent-signature-terms"
    >
      <Trans
        i18nKey="send.newSendFlow.sponsoredRentSignature.terms"
        values={{ provider: providerName }}
        components={[<TermsLink key="terms" href={termsUrl} />]}
      />
    </Text>
  );
}
