import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type {
  ICPAccount,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { useTheme } from "@react-navigation/native";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import invariant from "invariant";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { TrackScreen } from "~/analytics";
import BulletList, { BulletGreenCheck } from "~/components/BulletList";
import LText from "~/components/LText";
import NavigationScrollView from "~/components/NavigationScrollView";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import Illustration from "~/images/illustration/Illustration";
import EarnDark from "~/images/illustration/Dark/_003.webp";
import EarnLight from "~/images/illustration/Light/_003.webp";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import type { InternetComputerStakingFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerStakingFlowParamList,
    ScreenName.InternetComputerStakingStarted
  >
>;

const STEPS = ["0", "1", "2"] as const;

/**
 * Staking ICP creates a neuron: a locked position with its own dissolve delay and voting power,
 * rather than a delegation to a validator. The intro says so before any amount is chosen, because
 * the funds are not freely withdrawable afterwards.
 */
export default function StakingStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account } = useAccountScreen(route);
  invariant(account?.type === "Account", "internet_computer account required");

  const icpAccount = account as ICPAccount;
  const bridge = useAccountBridge<Transaction>(icpAccount);

  const onNext = useCallback(() => {
    const transaction = bridge.createTransaction(icpAccount);
    navigation.navigate(ScreenName.InternetComputerStakingAmount, {
      ...route.params,
      accountId: icpAccount.id,
      transaction: bridge.updateTransaction(transaction, { type: "create_neuron" }),
    });
  }, [bridge, icpAccount, navigation, route.params]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="Staking ICP Flow"
        name="Started"
        flow="stake"
        action="staking"
        currency={icpAccount.currency.id}
      />
      <NavigationScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <Flex alignItems="center" mb={6}>
          <Illustration lightSource={EarnLight} darkSource={EarnDark} size={150} />
        </Flex>
        <Text fontWeight="semiBold" style={styles.description}>
          {t("internetComputer.stakingFlow.started.description")}
        </Text>
        <BulletList
          Bullet={BulletGreenCheck}
          list={STEPS.map(index => (
            <LText semiBold key={index}>
              {t(`internetComputer.stakingFlow.started.steps.${index}`)}
            </LText>
          ))}
        />
      </NavigationScrollView>
      <View style={styles.footer}>
        <Button onPress={onNext} type="main" testID="icp-staking-start-button">
          {t("internetComputer.stakingFlow.started.cta")}
        </Button>
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
    paddingHorizontal: 32,
    paddingVertical: 32,
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 16,
  },
  footer: {
    padding: 16,
  },
});
