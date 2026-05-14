import { Button, Flex, Icons, IconsLegacy, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "~/context/Locale";
import { FlatList, ListRenderItemInfo, StyleSheet, View as RNView } from "react-native";
import { TrackScreen } from "~/analytics";
import { AccountLikeEnhanced } from "../ScanDeviceAccounts/types";
import SafeAreaView from "~/components/SafeAreaView";
import VerticalGradientBackground from "../../components/VerticalGradientBackground";
import AddFundsButton from "../../components/AddFundsButton";
import AnimatedAccountItem from "../../components/AccountsListView/components/AnimatedAccountItem";
import useAddAccountSuccessViewModel, { type Props } from "./useAddAccountSuccessViewModel";
import { AnalyticPages } from "LLM/hooks/useAnalytics/enums";

type ViewProps = ReturnType<typeof useAddAccountSuccessViewModel>;

function View({
  space,
  currency,
  accountsToAdd,
  statusColor,
  goToAccounts,
  keyExtractor,
  onCloseNavigation,
}: ViewProps) {
  const { t } = useTranslation();
  const isAleo = currency?.type === "CryptoCurrency" && currency.family === "aleo";

  const renderItem = ({ item, index }: ListRenderItemInfo<AccountLikeEnhanced>) => {
    return (
      <AnimatedAccountItem
        item={item}
        index={index}
        onPress={goToAccounts(item.id)}
        showUnitOnly={isAleo}
      >
        <Flex width={24} alignItems="flex-end" justifyContent="center">
          <IconsLegacy.PenMedium size={16} color="neutral.c70" />
        </Flex>
      </AnimatedAccountItem>
    );
  };

  return (
    <SafeAreaView edges={["left", "right", "bottom", "top"]} isFlex>
      <TrackScreen category="AddAccounts" name="Success" currency={currency?.name} />
      <VerticalGradientBackground stopColor={statusColor} stopOpacity={0.3} topOffset={-116} />
      <Flex alignItems="center" style={styles.root} pt={space[10]}>
        <Flex bg="opacityDefault.c05" style={styles.iconWrapper}>
          <Icons.CheckmarkCircleFill size="L" />
        </Flex>
        <Text style={styles.title} textAlign="center" width="60%">
          {t("addAccounts.added", { count: accountsToAdd.length })}
        </Text>
      </Flex>
      <Flex flex={1} justifyContent="center" alignItems="center">
        <FlatList
          testID="added-accounts-list"
          data={accountsToAdd}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <RNView style={{ height: space[4] }} />}
          style={{ paddingHorizontal: space[4], width: "100%" }}
        />
      </Flex>
      <Flex px={6} paddingTop={6} rowGap={6}>
        <AddFundsButton
          accounts={accountsToAdd}
          currency={currency}
          sourceScreenName={AnalyticPages.AddAccountSuccess}
        />
        <Button
          size="large"
          type="main"
          outline
          testID="button-close-add-account"
          onPress={onCloseNavigation}
        >
          {t("addAccounts.addAccountsSuccess.ctaClose")}
        </Button>
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 16,
    fontSize: 24,
  },
  iconWrapper: {
    height: 72,
    width: 72,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
});

const AddAccountSuccess: React.FC<Props> = props => (
  <View {...useAddAccountSuccessViewModel(props)} />
);

export default AddAccountSuccess;
