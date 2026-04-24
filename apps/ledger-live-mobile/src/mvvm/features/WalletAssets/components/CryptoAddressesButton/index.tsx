import React from "react";
import { StyleSheet } from "react-native";
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardLeading,
  CardContent,
  CardContentTitle,
  CardContentDescription,
  CardContentRow,
  CardTrailing,
  Spot,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, Wallet } from "@ledgerhq/lumen-ui-rnative/symbols";
import CurrencyIcon from "~/components/CurrencyIcon";
import { useTranslation } from "~/context/Locale";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { IconStack } from "LLM/components/IconStack";
import { useCryptoAddressesButtonViewModel } from "./useCryptoAddressesButtonViewModel";

export const CryptoAddressesButton: React.FC = () => {
  const { t } = useTranslation();
  const {
    accountsCount,
    hasAccounts,
    firstThreeCurrencies,
    moreAccountsCount,
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
              <CardContentTitle style={styles.cardContentTitle}>
                {t("portfolio.cryptoAddresses.title")}
              </CardContentTitle>
              <CardContentRow>
                {hasAccounts ? (
                  <>
                    <CardContentDescription>
                      {t("portfolio.cryptoAddresses.count", { count: accountsCount })}
                    </CardContentDescription>
                    <IconStack size={20} borderRadius={5}>
                      {firstThreeCurrencies.map(currency => (
                        <CurrencyIcon
                          key={currency.id}
                          currency={currency}
                          size={20}
                          squared
                          hideNetwork
                        />
                      ))}
                      {moreAccountsCount > 0 && (
                        <Box
                          lx={{
                            flex: 1,
                            width: "full",
                            height: "full",
                            backgroundColor: "interactive",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text typography="body4" lx={{ color: "onInteractive" }}>
                            +{moreAccountsCount}
                          </Text>
                        </Box>
                      )}
                    </IconStack>
                  </>
                ) : (
                  <CardContentDescription>
                    {t("portfolio.cryptoAddresses.noAccountsYet")}
                  </CardContentDescription>
                )}
              </CardContentRow>
            </CardContent>
          </CardLeading>
          {hasAccounts ? (
            <CardTrailing>
              <ChevronRight size={24} color="muted" />
            </CardTrailing>
          ) : (
            <CardTrailing>
              <Button appearance="base" size="sm" onPress={onPress} testID="add-account-cta">
                {t("portfolio.cryptoAddresses.add")}
              </Button>
            </CardTrailing>
          )}
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

/*
 * CardContentDescription uses body typography (~16px line height) while IconStack
 * is 20px tall, so the row is visually taller than the text alone. A small
 * negative margin on the title nudges it toward the row so vertical rhythm
 * matches design. This is sensitive to font scaling (Dynamic Type): if the
 * description grows, re-check alignment.
 */
const styles = StyleSheet.create({
  cardContentTitle: {
    marginBottom: -4,
  },
});
