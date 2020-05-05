// @flow
import React, { useCallback } from "react";
import { StyleSheet, ScrollView } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import type {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/types";
import { getMainAccount } from "@ledgerhq/live-common/lib/account/helpers";
import { accountScreenSelector } from "../../reducers/accounts";
import colors from "../../colors";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import SelectDevice from "../../components/SelectDevice";
import { connectingStep, accountApp } from "../../components/DeviceJob/steps";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {
  accountId: string,
  transaction: Transaction,
  status: TransactionStatus,
};

export default function ConnectDevice({ navigation, route }: Props) {
  const { account } = useSelector(accountScreenSelector(route));

  const onSelectDevice = useCallback(
    (meta: any) => {
      navigation.replace(ScreenName.UnfreezeValidation, {
        ...route.params,
        ...meta,
      });
    },
    [navigation, route.params],
  );

  if (!account) return null;

  const mainAccount = getMainAccount(account, undefined);

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="UnfreezeFunds" name="ConnectDevice" />
        <SelectDevice
          onSelect={onSelectDevice}
          steps={[connectingStep, accountApp(mainAccount)]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
});
