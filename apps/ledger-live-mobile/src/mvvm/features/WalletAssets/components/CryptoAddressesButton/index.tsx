import React from "react";
import {
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentTitle,
  CardContentDescription,
  CardContentRow,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Wallet } from "@ledgerhq/lumen-ui-rnative/symbols";
import CurrencyIcon from "~/components/CurrencyIcon";
import { useTranslation } from "~/context/Locale";
import { useCryptoAddressesButtonViewModel } from "./useCryptoAddressesButtonViewModel";

export const CryptoAddressesButton: React.FC = () => {
  const { t } = useTranslation();
  const { accountsCount, firstThreeCurrencies, onPress } = useCryptoAddressesButtonViewModel();

  return (
    <Card onPress={onPress} testID="crypto-addresses-button">
      <CardHeader>
        <CardLeading>
          <Spot appearance="icon" icon={Wallet} />
          <CardContent>
            <CardContentTitle>{t("portfolio.cryptoAddresses.title")}</CardContentTitle>
            <CardContentRow>
              <CardContentDescription>
                {t("portfolio.cryptoAddresses.count", { count: accountsCount })}
              </CardContentDescription>
              {firstThreeCurrencies.map(currency => (
                <CurrencyIcon key={currency.id} currency={currency} size={20} squared />
              ))}
            </CardContentRow>
          </CardContent>
        </CardLeading>
      </CardHeader>
    </Card>
  );
};
