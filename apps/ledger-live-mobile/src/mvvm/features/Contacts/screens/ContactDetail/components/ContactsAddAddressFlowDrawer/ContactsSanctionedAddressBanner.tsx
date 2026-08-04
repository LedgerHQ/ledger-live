import React, { useCallback } from "react";
import { Linking } from "react-native";
import { Banner, Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";

export function ContactsSanctionedAddressBanner(): React.JSX.Element {
  const { t } = useTranslation();
  const helpCenterUrl = useLocalizedUrl(urls.resources.helpCenter);
  const handleLearnMore = useCallback(() => {
    void Linking.openURL(helpCenterUrl);
  }, [helpCenterUrl]);

  return (
    <Banner
      testID="contacts-sanctioned-address-banner"
      appearance="error"
      description={t("contacts.addAddressEntry.sanctioned.description")}
      primaryAction={
        <Button appearance="transparent" size="sm" onPress={handleLearnMore}>
          {t("contacts.addAddressEntry.sanctioned.learnMore")}
        </Button>
      }
    />
  );
}
