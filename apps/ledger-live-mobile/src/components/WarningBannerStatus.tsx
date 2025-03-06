import React, { useCallback } from "react";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import { Text } from "@ledgerhq/native-ui";
import { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Trans } from "react-i18next";
import { Linking } from "react-native";
import { View } from "react-native-animatable";
import styled from "styled-components/native";
import Alert from "~/components/Alert";
import { urls } from "~/utils/urls";

const UnderlinedText = styled(Text)`
  text-decoration-line: underline;
`;

type Props = {
  currency: CryptoCurrency | CryptoOrTokenCurrency;
  currencyConfig?: (CurrencyConfig & Record<string, unknown>) | undefined;
};

const WarningBannerStatus = ({ currencyConfig, currency }: Props) => {
  const supportLink =
    currencyConfig?.status?.type === "feature_unavailable" ||
    currencyConfig?.status?.type === "migration"
      ? currencyConfig?.status.link
      : undefined;

  const openSupportLink = useCallback(() => {
    Linking.openURL(supportLink || urls.contactSupportWebview.en);
  }, [supportLink]);

  if (!currencyConfig) return null;

  if (currencyConfig?.status.type === "migration") {
    return (
      <View style={{ marginTop: 16 }}>
        <Alert
          key="migration_banner"
          type="warning"
          learnMoreKey="account.migrationBanner.contactSupport"
          learnMoreUrl={urls.contactSupportWebview.en}
        >
          <Trans
            i18nKey="account.migrationBanner.title"
            values={{
              from: currencyConfig.status.from,
              to: currencyConfig.status.to,
            }}
            components={[<UnderlinedText onPress={openSupportLink} key="SupportLink" />]}
          />
        </Alert>
      </View>
    );
  }

  if (currencyConfig?.status.type === "will_be_deprecated") {
    return (
      <View style={{ marginTop: 16 }}>
        <Alert
          key="deprecated_banner"
          type="warning"
          learnMoreKey="account.willBedeprecatedBanner.contactSupport"
          learnMoreUrl={urls.contactSupportWebview.en}
        >
          <Trans
            i18nKey="account.willBedeprecatedBanner.title"
            values={{
              currencyName: currency.name,
              deprecatedDate: currencyConfig.status.deprecated_date,
            }}
          />
        </Alert>
      </View>
    );
  }
};

export default WarningBannerStatus;
