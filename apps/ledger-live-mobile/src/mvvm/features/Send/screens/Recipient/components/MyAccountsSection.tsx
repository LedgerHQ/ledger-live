import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { ScrollView } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useMyAccountsSectionViewModel } from "../hooks/useMyAccountsSectionViewModel";
import { MyAddressItem } from "./MyAddressItem";

type MyAccountSectionProps = Readonly<{
  currentAccountId: string;
  currency: CryptoOrTokenCurrency;
  onSelect: (account: Account) => void;
}>;

export const MyAccountsSection = ({
  currentAccountId,
  currency,
  onSelect,
}: MyAccountSectionProps) => {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    theme => ({
      accountsScrollContent: {
        paddingVertical: theme.spacings.s8,
      },
    }),
    [],
  );

  const { userAccountsForCurrency } = useMyAccountsSectionViewModel({
    currentAccountId: currentAccountId,
    currency: currency,
  });

  return userAccountsForCurrency.length > 0 ? (
    <Box>
      <Subheader>
        <SubheaderRow lx={{ paddingHorizontal: "s8", marginBottom: "s12" }}>
          <SubheaderTitle typography="body4SemiBold">
            {t("send.newSendFlow.myAccounts")}
          </SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <ScrollView contentContainerStyle={styles.accountsScrollContent}>
        {userAccountsForCurrency.map(userAccount => (
          <MyAddressItem
            key={userAccount.id}
            currentAccount={userAccount}
            onSelect={() => onSelect(userAccount)}
          />
        ))}
      </ScrollView>
    </Box>
  ) : null;
};
