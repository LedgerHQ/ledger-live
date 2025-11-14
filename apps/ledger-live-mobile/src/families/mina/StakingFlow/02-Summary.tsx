import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { CompositeScreenProps } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { Box, Text, Flex } from "@ledgerhq/native-ui";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import Button from "~/components/Button";
import SummaryRow from "~/screens/SendFunds/SummaryRow";
import AccountCard from "~/components/AccountCard";
import CopyLink from "../components/CopyLink";

import { MinaStakingFlowParamList } from "./types";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

const truncateAddress = (address: string, startLength = 10, endLength = 8): string => {
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

type Props = CompositeScreenProps<
  StackNavigatorProps<MinaStakingFlowParamList, ScreenName.MinaStakingSummary>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

function StakingSummary({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account } = useSelector(accountScreenSelector(route));
  const { transaction } = route.params;

  const onContinue = useCallback(() => {
    if (!account) return;

    navigation.navigate(ScreenName.MinaStakingSelectDevice, {
      accountId: account.id,
      parentId: account.type === "TokenAccount" ? account.parentId : undefined,
      transaction,
    });
  }, [account, transaction, navigation]);

  if (!account || !transaction) return null;
  const currency = getCryptoCurrencyById("mina");

  const { fees } = transaction;

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <Flex flex={1}>
        <Box mb={6}>
          <AccountCard account={account} />
        </Box>

        <Box mb={4}>
          <Text variant="h4" fontWeight="semiBold" color="neutral.c100" mb={4}>
            {t("delegation.summaryTitle")}
          </Text>

          <SummaryRow title={t("delegation.validatorAddress")}>
            <CopyLink
              string={transaction.recipient || ""}
              replacement={t("mina.copyLinkCopied")}
              style={styles.addressCopy}
            >
              <Text variant="body" color="primary.c80" fontWeight="medium">
                {truncateAddress(transaction.recipient || "")}
              </Text>
            </CopyLink>
          </SummaryRow>

          <SummaryRow title={t("send.summary.fees")}>
            <Text variant="body" color="neutral.c100">
              {fees
                ? `${formatCurrencyUnit(currency.units[0], fees.fee, { showCode: true })}`
                : "0 MINA"}
            </Text>
          </SummaryRow>

          <SummaryRow title={t("send.summary.amount")}>
            <Text variant="body" color="neutral.c100">
              {formatCurrencyUnit(currency.units[0], account.spendableBalance, { showCode: true })}
            </Text>
          </SummaryRow>
        </Box>
      </Flex>

      <Box>
        <Button type="primary" title={t("common.continue")} onPress={onContinue} />
      </Box>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  addressCopy: {
    alignSelf: "flex-start",
  },
});

export default StakingSummary;
