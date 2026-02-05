import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { CardanoAccount } from "@ledgerhq/live-common/families/cardano/types";
import { StyleSheet } from "react-native";
import { Text, Flex } from "@ledgerhq/native-ui";
import { ScreenName, NavigatorName } from "~/const";
import QueuedDrawer from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import Illustration from "~/images/illustration/Illustration";
import EarnLight from "~/images/illustration/Light/_003.webp";
import EarnDark from "~/images/illustration/Dark/_003.webp";
import { Trans } from "~/context/Locale";
import Button from "~/components/wrappedUi/Button";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import BigNumber from "bignumber.js";

// used for internal transaction
const DEFAULT_TX_AMOUNT = 2000000;

export default function DRepDelegationSelfTransactionInfoDrawer({
  account,
  isOpen,
  onClose,
}: Readonly<{
  account: CardanoAccount;
  isOpen: boolean;
  onClose: () => void;
}>) {
  const navigation = useNavigation();

  const onContinue = useCallback(() => {
    const bridge = getAccountBridge(account);
    const transaction = bridge.createTransaction(account);
    const updatedTransaction = bridge.updateTransaction(transaction, {
      recipient: account.freshAddress,
      amount: BigNumber(DEFAULT_TX_AMOUNT),
    });

    navigation.navigate(NavigatorName.SendFunds, {
      screen: ScreenName.SendSelectRecipient,
      params: {
        accountId: account.id,
        transaction: updatedTransaction,
      },
    });
  }, [account, navigation]);

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
      <Flex alignItems="center">
        <Illustration lightSource={EarnLight} darkSource={EarnDark} size={100} />

        <Text style={dRepDelegationSelfTransactionInfoDrawerStyles.title}>
          <Trans i18nKey="cardano.undelegation.dRepDelegationSelfTransactionDrawer.title" />
        </Text>
        <Text style={dRepDelegationSelfTransactionInfoDrawerStyles.description}>
          <Trans i18nKey="cardano.undelegation.dRepDelegationSelfTransactionDrawer.description" />
        </Text>

        <Button mt={8} type="main" onPress={onContinue}>
          <Trans i18nKey="common.continue" />
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}

const dRepDelegationSelfTransactionInfoDrawerStyles = StyleSheet.create({
  title: {
    fontSize: 22,
    lineHeight: 33,
    fontWeight: "semibold",
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "left",
  },
});
