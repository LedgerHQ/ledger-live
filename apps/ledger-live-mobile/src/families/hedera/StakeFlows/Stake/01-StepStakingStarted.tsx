import { useTheme } from "@react-navigation/native";
import { View, StyleSheet } from "react-native";
import React from "react";
import { Divider, Icons, Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import { HederaAccount } from "@ledgerhq/live-common/families/hedera/types";
import Button from "../../../../components/Button";
import { StackNavigatorProps } from "../../../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../../../const";
import { HederaStakeFlowParamList } from "../types";
import { accountScreenSelector } from "../../../../reducers/accounts";

type Props = StackNavigatorProps<
  HederaStakeFlowParamList,
  ScreenName.HederaStakingStarted
>;

function StepStakingStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));
  const hederaAccount = account as HederaAccount;

  const onNext = () => {
    navigation.navigate(ScreenName.HederaStakingType, {
      ...route.params,
      account: hederaAccount,
    });
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>
          <Trans i18nKey="hedera.stake.flow.stake.startedTitle" />{" "}
        </Text>
        <Text style={styles.subTitle}>
          <Trans i18nKey="hedera.stake.flow.stake.startedSubTitle" />{" "}
        </Text>
        <View style={styles.action}>
          <Icons.RefreshMedium size={24} color="#BBB0FF" />
          <Text style={styles.actionText}>
            <Trans i18nKey="hedera.stake.flow.stake.startedStake" />{" "}
          </Text>
        </View>
        <Divider />
        <View style={styles.action}>
          <Icons.CoinsMedium size={24} color="#BBB0FF" />
          <Text style={styles.actionText}>
            <Trans i18nKey="hedera.stake.flow.stake.startedNoLock" />{" "}
          </Text>
        </View>
        <Divider />
        <View style={styles.action}>
          <Icons.ListMedium size={24} color="#BBB0FF" />
          <Text style={styles.actionText}>
            <Trans i18nKey="hedera.stake.flow.stake.startedReceive" />{" "}
          </Text>
        </View>
        <Divider />
        <View style={styles.action}>
          <Icons.CoinsMedium size={24} color="#BBB0FF" />
          <Text style={styles.actionText}>
            <Trans i18nKey="hedera.stake.flow.stake.startedNoLock2" />{" "}
          </Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          event="Hedera StepStakingStartedContinueBtn"
          onPress={onNext}
          title={<Trans i18nKey="hedera.common.continue" />}
          type="main"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 32,
    lineHeight: 32.4,
  },
  subTitle: {
    color: "#949494",
  },
  action: {
    display: "flex",
    flexDirection: "row",
    color: "#BBB0FF",
    gap: 12,
    paddingVertical: 24,
  },
  actionText: {
    fontSize: 16,
    lineHeight: 27.2,
    flex: 1,
    flexWrap: "wrap",
  },
  buttonContainer: {
    paddingBottom: 24,
  },
});

export default StepStakingStarted;
