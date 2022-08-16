import invariant from "invariant";
import useBridgeTransaction from "@ledgerhq/live-common/lib/bridge/useBridgeTransaction";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { TrackScreen } from "../../../analytics";
import BulletList, { BulletGreenCheck } from "../../../components/BulletList";
import Button from "../../../components/Button";
import ExternalLink from "../../../components/ExternalLink";
import NavigationScrollView from "../../../components/NavigationScrollView";
import { urls } from "../../../config/urls";
import { ScreenName } from "../../../const";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { accountScreenSelector } from "../reducers/accounts";
import { useSelector } from "react-redux";

type Props = {
  navigation: any,
  route: { params: any },
};

export default function SimpleOperationStarted({ navigation, route }: Props) {
  const { colors } = useTheme();

  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = getAccountBridge(account, parentAccount);

  const { transaction } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(mainAccount);

    return {
      account,
      transaction: bridge.updateTransaction(t, {
        mode: "register",
      }),
    };
  });

  invariant(transaction, "transaction required");

  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.PolkadotRebondSelectDevice);
  }, [navigation, route.params, transaction, bridge]);

  const howDelegationWorks = useCallback(() => {
    Linking.openURL(urls.delegation);
  }, []);

  //TODO: Add warning if not enough CELO balance
  //TODO: add translation text
  return (
    <View
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={{ bottom: "always" }}
    >
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="CeloSimpleOperationFlow" name="Started" />
        <Text fontWeight="semiBold" style={styles.title}>
          {
            "Before locking any Celo you need to register your account on-chain."
          }
        </Text>
      </NavigationScrollView>
      <View style={styles.footer}>
        <Button
          event="DelegationStartedBtn"
          onPress={onNext}
          title={<Trans i18nKey="delegation.started.cta" />}
          type="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingVertical: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    lineHeight: 33,
    paddingVertical: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 16,
  },
  bulletItem: {
    fontSize: 14,
  },
  howDelegationWorks: {
    marginTop: 32,
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: "row",
  },
  footer: {
    padding: 16,
  },
});
