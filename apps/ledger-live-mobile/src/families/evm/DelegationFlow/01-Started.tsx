import React, { useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Alert, Button, Flex, Text } from "@ledgerhq/native-ui";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getUnbondingPeriodDays } from "@ledgerhq/live-common/families/evm/staking/logic";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { ScreenName } from "~/const";
import NavigationScrollView from "~/components/NavigationScrollView";
import { TrackScreen } from "~/analytics";
import Illustration from "~/images/illustration/Illustration";
import EarnLight from "~/images/illustration/Light/_003.webp";
import EarnDark from "~/images/illustration/Dark/_003.webp";
import BulletList, { BulletGreenCheck } from "~/components/BulletList";
import { Trans, useTranslation } from "~/context/Locale";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { EvmDelegationFlowParamList } from "./types";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

type Props = StackNavigatorProps<EvmDelegationFlowParamList, ScreenName.EvmDelegationStarted>;

export default function DelegationStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.EvmDelegationValidator, {
      ...route.params,
    });
  }, [navigation, route.params]);

  const { account, parentAccount } = useAccountScreen(route);
  const mainAccount = getMainAccount(account!, parentAccount);
  const { ticker, name } = getAccountCurrency(mainAccount);
  const unbondingDays = getUnbondingPeriodDays(mainAccount.currency.id);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NavigationScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <TrackScreen
          category="EvmDelegationFlow"
          name="Step Starter"
          flow="stake"
          action="delegation"
          currency={ticker}
        />
        <Flex alignItems="center" mt={6}>
          <Illustration size={150} darkSource={EarnDark} lightSource={EarnLight} />
        </Flex>
        <Text fontWeight="semiBold" variant="h4" textAlign="center" mt={6}>
          <Trans i18nKey="delegation.started.title" />
        </Text>
        <BulletList
          style={styles.bulletList}
          itemContainerStyle={styles.bulletListItem}
          Bullet={BulletGreenCheck}
          list={[
            <Text fontWeight="semiBold" variant="body" key="a">
              <Trans
                i18nKey="evm.delegation.flow.steps.starter.steps.0"
                values={{ name, ticker }}
              />
            </Text>,
            <Text fontWeight="semiBold" variant="body" key="b">
              <Trans
                i18nKey="evm.delegation.flow.steps.starter.steps.1"
                values={{ numberOfDays: unbondingDays ?? 0 }}
              />
            </Text>,
            <Text fontWeight="semiBold" variant="body" key="c">
              <Trans i18nKey="evm.delegation.flow.steps.starter.steps.2" />
            </Text>,
          ]}
        />
        <Alert type="info" title={t("evm.delegation.flow.steps.starter.warning.description")} />
      </NavigationScrollView>
      <View style={[styles.footer, { borderColor: colors.lightFog }]}>
        <Button onPress={onNext} type="main">
          <Trans i18nKey="evm.delegation.flow.steps.starter.cta" />
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
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  bulletList: {
    marginVertical: 16,
  },
  bulletListItem: {
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
