import React, { useCallback, useMemo, memo } from "react";

import invariant from "invariant";
import { getNFT } from "@ledgerhq/live-common/nft/index";
import { View, StyleSheet, TextInput, TouchableWithoutFeedback, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BigNumber } from "bignumber.js";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { SendFundsNavigatorStackParamList } from "~/components/RootNavigator/types/SendFundsNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { accountScreenSelector } from "~/reducers/accounts";
import TranslatedError from "~/components/TranslatedError";
import KeyboardView from "~/components/KeyboardView";
import Button from "~/components/Button";
import LText from "~/components/LText";
import { ScreenName } from "~/const";

type Props = BaseComposite<
  StackNavigatorProps<SendFundsNavigatorStackParamList, ScreenName.SendAmountNft>
>;

const SendAmountNFT = ({ route }: Props) => {
  const navigation = useNavigation<Props["navigation"]>();
  const { t } = useTranslation();

  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account required");

  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = useMemo(() => getAccountBridge(account, parentAccount), [account, parentAccount]);
  const { transaction, setTransaction, status, bridgePending } = useBridgeTransaction(() => ({
    transaction: route.params.transaction,
    account,
    parentAccount,
  }));
  invariant(transaction, "transaction required");

  const onQuantityChange = useCallback(
    (text: string) => {
      const newQuantity = new BigNumber(text.replace(/\D/g, ""));
      if (!bridge) return;

      if (mainAccount.currency.family === "evm") {
        setTransaction(
          bridge.updateTransaction(transaction, {
            nft: {
              ...((transaction && "nft" in transaction && transaction.nft) || {}),
              quantity: newQuantity,
            },
          }),
        );
      }
    },
    [bridge, mainAccount.currency.family, setTransaction, transaction],
  );
  const quantity = useMemo(() => {
    if (transaction.family === "evm") {
      return transaction.nft?.quantity;
    }
  }, [transaction]);

  const nft = useMemo(() => {
    if (transaction.family === "evm") {
      return getNFT(transaction.nft?.contract, transaction.nft?.tokenId, mainAccount.nfts);
    }
  }, [mainAccount, transaction]);

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.SendSummary, {
      accountId: account.id,
      parentId: parentAccount?.id,
      transaction,
      currentNavigation: ScreenName.SendSummary,
      nextNavigation: ScreenName.SendSelectDevice,
    });
  }, [account, navigation, parentAccount?.id, transaction]);
  const blur = useCallback(() => Keyboard.dismiss(), []);

  const error = useMemo(() => {
    if (quantity?.isFinite()) {
      if (status?.warnings?.amount) {
        return (
          <LText style={styles.error} color={"orange"} numberOfLines={2}>
            <TranslatedError error={status?.warnings?.amount} />
          </LText>
        );
      }

      if (status?.errors?.amount) {
        return (
          <LText style={styles.error} color={"alert"} numberOfLines={2}>
            <TranslatedError error={status?.errors?.amount} />
          </LText>
        );
      }
    }

    return <LText style={styles.error} numberOfLines={2} />;
  }, [quantity, status?.errors?.amount, status?.warnings?.amount]);

  return (
    <>
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <KeyboardView style={styles.container}>
          <TouchableWithoutFeedback onPress={blur}>
            <View style={{ flex: 1 }}>
              <View style={styles.amountContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.black,
                    },
                  ]}
                  autoCorrect={false}
                  autoFocus={true}
                  caretHidden={true}
                  editable={true}
                  multiline={false}
                  keyboardType="numeric"
                  value={quantity?.isFinite() ? quantity?.toString() : undefined}
                  onChangeText={onQuantityChange}
                  placeholder="0"
                />
                {error}
              </View>
              <View style={styles.availableContainer}>
                <LText style={styles.available}>
                  {t("send.amount.quantityAvailable")} :{"  "}
                </LText>
                <LText bold style={styles.available}>
                  {nft?.amount?.toFixed()}
                </LText>
              </View>
              <View style={styles.continueContainer}>
                <Button
                  type="primary"
                  title={!bridgePending ? t("common.continue") : t("send.amount.loadingNetwork")}
                  onPress={onContinue}
                  disabled={!quantity?.isFinite() || !!status.errors.amount || bridgePending}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  amountContainer: {
    flexGrow: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    fontSize: 50,
    textAlign: "center",
    padding: 16,
  },
  error: {
    width: "100%",
    height: 40,
    textAlign: "center",
    marginTop: 10,
  },
  availableContainer: {
    flexDirection: "row",
    flexGrow: 0,
    justifyContent: "center",
    paddingBottom: 16,
  },
  available: {
    textAlign: "center",
  },
  continueContainer: {
    flexGrow: 0,
    alignSelf: "stretch",
    alignItems: "stretch",
    justifyContent: "flex-end",
    paddingBottom: 16,
  },
});

export default memo(SendAmountNFT);
