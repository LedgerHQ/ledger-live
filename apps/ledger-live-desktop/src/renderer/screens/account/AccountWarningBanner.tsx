import React, { useCallback } from "react";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { Link, Text } from "@ledgerhq/react-ui";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Trans, useTranslation } from "react-i18next";
import { urls } from "~/config/urls";
import TopBanner from "~/renderer/components/TopBanner";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
import { CurrencyConfig } from "@ledgerhq/coin-framework/config";

type Props = {
  currency: CryptoCurrency;
};

const AccountWarningBanner = ({ currency }: Props) => {
  const { t } = useTranslation();
  const localizedContactSupportURL = useLocalizedUrl(urls.contactSupportWebview);

  let currencyConfig: CurrencyConfig | undefined = undefined;

  try {
    currencyConfig = getCurrencyConfiguration(currency);
  } catch (err) {
    console.warn(err);
  }

  const supportLink =
    currencyConfig?.status?.type === "feature_unavailable" ||
    currencyConfig?.status?.type === "migration"
      ? currencyConfig?.status.link
      : undefined;

  const openSupportLink = useCallback(() => {
    openURL(supportLink || localizedContactSupportURL);
  }, [supportLink, localizedContactSupportURL]);

  if (!currencyConfig) return null;

  return (
    <>
      {currencyConfig?.status.type === "migration" && (
        <TopBanner
          testId="migration-banner"
          status="warning"
          content={{
            message: (
              <Text fontFamily="Inter|Bold" color="neutral.c00" flex={1}>
                <Trans
                  i18nKey="account.migrationBanner.title"
                  values={{
                    from: currencyConfig.status.from,
                    to: currencyConfig.status.to,
                  }}
                  components={[
                    <Link key={0} color="neutral.c00" alwaysUnderline onClick={openSupportLink} />,
                  ]}
                />
              </Text>
            ),
          }}
          link={{
            text: t("account.migrationBanner.contactSupport"),
            href: localizedContactSupportURL,
          }}
        />
      )}
      {currencyConfig?.status.type === "feature_unavailable" && (
        <TopBanner
          testId="feature-unavailable-banner"
          status="warning"
          content={{
            message: (
              <Text fontFamily="Inter|Bold" color="neutral.c00" flex={1}>
                {t("account.featureUnavailable.title", {
                  feature: t(`account.featureUnavailable.feature.${currencyConfig.status.feature}`),
                  support: "",
                })}
                <Link color="neutral.c00" alwaysUnderline onClick={openSupportLink}>
                  {t("account.featureUnavailable.support")}
                </Link>
              </Text>
            ),
          }}
        />
      )}
      {currencyConfig?.status.type === "will_be_deprecated" && (
        <TopBanner
          testId="deprecated-banner"
          status="warning"
          content={{
            message: t("account.willBeDeprecatedBanner.title", {
              currencyName: currency.name,
              deprecatedDate: currencyConfig.status.deprecated_date,
            }),
          }}
          link={{
            text: t("account.willBeDeprecatedBanner.contactSupport"),
            href: localizedContactSupportURL,
          }}
        />
      )}
    </>
  );
};

export default AccountWarningBanner;
