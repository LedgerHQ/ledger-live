import React from "react";
import { StyleSheet } from "react-native";
import { Flex, Icons, rgba, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Account } from "@ledgerhq/types-live";
import SafeAreaView from "~/components/SafeAreaView";
import Circle from "~/components/Circle";
import CloseWithConfirmation from "LLM/components/CloseWithConfirmation";
import VerticalGradientBackground from "../../components/VerticalGradientBackground";
import AddFundsButton from "../../components/AddFundsButton";
import useAddAccountWarningViewModel, { type Props } from "./useAddAccountWarningViewModel";
import AnimatedAccountItem from "../../components/AccountsListView/components/AnimatedAccountItem";
import { AnalyticPages } from "LLM/hooks/useAnalytics/enums";

type ViewProps = ReturnType<typeof useAddAccountWarningViewModel>;

const View = ({
  space,
  statusColor,
  emptyAccount,
  emptyAccountName,
  currency,
  goToAccounts,
  handleOnCloseWarningScreen,
}: ViewProps) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView edges={["left", "right", "bottom", "top"]} isFlex>
      <VerticalGradientBackground stopColor={statusColor} />
      <Flex alignItems="center" pt={space[10]}>
        <Circle size={24} bg={rgba(statusColor, 0.05)} style={styles.iconWrapper}>
          <Icons.WarningFill size="L" color={statusColor} />
        </Circle>
        <Text style={styles.title}>
          {t("addAccounts.addAccountsWarning.cantCreateAccount.title", {
            accountName: emptyAccountName,
          })}
        </Text>
        <Text style={styles.desc} variant="bodyLineHeight" color="neutral.c70">
          {t("addAccounts.addAccountsWarning.cantCreateAccount.body", {
            accountName: emptyAccountName,
          })}
        </Text>
      </Flex>
      <Flex flex={1} px={space[6]} flexDirection="row" justifyContent="center">
        <AnimatedAccountItem
          item={emptyAccount as Account}
          onPress={goToAccounts(emptyAccount?.id as string)}
        >
          <Icons.ChevronRight color="neutral.c100" />
        </AnimatedAccountItem>
      </Flex>
      <Flex px={6} rowGap={6}>
        <AddFundsButton
          accounts={[emptyAccount as Account]}
          currency={currency}
          sourceScreenName={AnalyticPages.AddAccountWarning}
        />
        <CloseWithConfirmation
          showButton
          buttonText={t("addAccounts.addAccountsSuccess.ctaClose")}
          onClose={handleOnCloseWarningScreen}
        />
      </Flex>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: {
    marginTop: 16,
    fontSize: 24,
    textAlign: "center",
    width: "100%",
    fontWeight: 600,
    fontStyle: "normal",
    lineHeight: 32.4,
    letterSpacing: 0.75,
  },
  desc: {
    marginTop: 16,
    marginBottom: 32,
    marginHorizontal: 32,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 24,
  },
  iconWrapper: {
    height: 72,
    width: 72,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});

const AddAccountsWarning: React.FC<Props> = props => (
  <View {...useAddAccountWarningViewModel(props)} />
);

export default AddAccountsWarning;
