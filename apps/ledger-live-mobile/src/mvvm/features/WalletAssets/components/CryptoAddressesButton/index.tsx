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
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { useCryptoAddressesButtonViewModel } from "./useCryptoAddressesButtonViewModel";

export const CryptoAddressesButton: React.FC = () => {
  const { t } = useTranslation();
  const {
    accountsCount,
    hasAccounts,
    firstThreeCurrencies,
    onPress,
    isAddAccountOpen,
    onCloseAddAccount,
  } = useCryptoAddressesButtonViewModel();

  return (
    <>
      <Card onPress={onPress} testID="crypto-addresses-button">
        <CardHeader>
          <CardLeading>
            <Spot appearance="icon" icon={Wallet} />
            <CardContent>
              <CardContentTitle>{t("portfolio.cryptoAddresses.title")}</CardContentTitle>
              <CardContentRow>
                {hasAccounts ? (
                  <>
                    <CardContentDescription>
                      {t("portfolio.cryptoAddresses.count", { count: accountsCount })}
                    </CardContentDescription>
                    {firstThreeCurrencies.map(currency => (
                      <CurrencyIcon key={currency.id} currency={currency} size={20} squared />
                    ))}
                  </>
                ) : (
                  <CardContentDescription>
                    {t("portfolio.cryptoAddresses.noAddressYet")}
                  </CardContentDescription>
                )}
              </CardContentRow>
            </CardContent>
          </CardLeading>
        </CardHeader>
      </Card>
      {!hasAccounts && (
        <AddAccountDrawer
          isOpened={isAddAccountOpen}
          onClose={onCloseAddAccount}
          doesNotHaveAccount
        />
      )}
    </>
  );
};
