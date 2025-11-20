import React, { useCallback } from "react";
import { StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompositeScreenProps } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useSelector } from "react-redux";
import { Box, Text, Flex } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import Button from "~/components/Button";
import ValidatorRow from "./ValidatorRow";
import { MinaStakingFlowParamList } from "./types";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { MinaAccount } from "@ledgerhq/live-common/families/mina/types";

type Props = CompositeScreenProps<
  StackNavigatorProps<MinaStakingFlowParamList, ScreenName.MinaStakingValidator>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

function StakingValidator({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account } = useSelector(accountScreenSelector(route));

  const { transaction, setTransaction } = useBridgeTransaction(() => {
    if (!account) throw new Error("Account is required");
    const bridge = getAccountBridge(account);
    const tx = bridge.createTransaction(account);

    const transaction = bridge.updateTransaction(tx, {
      txType: "stake",
    });

    return { account, transaction };
  });

  const onSelectValidator = useCallback(
    (validatorAddress: string) => {
      if (!account || !transaction) return;

      const bridge = getAccountBridge(account);
      const updatedTransaction = bridge.updateTransaction(transaction, {
        recipient: validatorAddress,
      });

      setTransaction(updatedTransaction);
    },
    [account, transaction, setTransaction],
  );

  const onContinue = useCallback(() => {
    if (!account || !transaction?.recipient) return;

    navigation.navigate(ScreenName.MinaStakingSummary, {
      accountId: account.id,
      transaction,
    });
  }, [account, transaction, navigation]);

  const renderItem = useCallback(
    ({ item }: { item: (typeof validators)[0] }) => (
      <ValidatorRow
        validator={item}
        onSelect={() => onSelectValidator(item.address)}
        isSelected={transaction?.recipient === item.address}
      />
    ),
    [onSelectValidator, transaction?.recipient],
  );

  if (!account) return null;

  const mainAccount = getMainAccount<MinaAccount>(account, undefined);
  const hasDelegation = mainAccount?.resources?.stakingActive;
  const validators = mainAccount?.resources?.blockProducers || [];

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <Flex flex={1}>
        <Box mb={4}>
          <Text variant="body" color="neutral.c80">
            {t("mina.selectValidator.help")}
          </Text>
        </Box>

        <Box flex={1}>
          {validators.length > 0 ? (
            <FlatList
              data={validators}
              renderItem={renderItem}
              keyExtractor={validator => validator.address}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Box flex={1} justifyContent="center" alignItems="center">
              <Text variant="body" color="neutral.c70">
                {t("mina.selectValidator.noValidators")}
              </Text>
            </Box>
          )}
        </Box>

        <Box>
          <Button
            type="primary"
            title={
              hasDelegation
                ? t("mina.accountHeaderManageActions.changeDelegation")
                : t("common.continue")
            }
            onPress={onContinue}
            disabled={
              !transaction?.recipient ||
              transaction?.recipient === mainAccount?.resources?.delegateInfo?.address
            }
          />
        </Box>
      </Flex>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 16,
  },
  list: {
    paddingBottom: 16,
  },
});

export default StakingValidator;
