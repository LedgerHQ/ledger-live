import React, { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import type { ParamListBase, RouteProp } from "@react-navigation/native";
import type { Operation } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { Transaction } from "@ledgerhq/live-common/families/stacks/types";
import { track } from "@shared/analytics";
import { TrackScreen } from "@shared/analytics-react";
import { Trans } from "~/context/Locale";
import PreventNativeBack from "~/components/PreventNativeBack";
import ValidateSuccess from "~/components/ValidateSuccess";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";

/** What differs between the stake and unstake success screens. */
const VARIANTS = {
  stake: {
    event: "staking_completed",
    delegation: "delegation",
    category: "StacksStakingFlow",
    action: "delegate",
    titleKey: "stacks.stake.validation.success.title",
    descriptionKey: "stacks.stake.validation.success.description",
  },
  unstake: {
    event: "undelegation_completed",
    delegation: "undelegation",
    category: "StacksUnstakingFlow",
    action: "undelegate",
    titleKey: "stacks.unstake.validation.success.title",
    descriptionKey: "stacks.unstake.validation.success.description",
  },
} as const;

type Props = Readonly<{
  navigation: StackNavigatorNavigation<BaseNavigatorStackParamList>;
  /** Both flows' ValidationSuccess routes carry these params. */
  route: {
    params: {
      accountId: string;
      parentId?: string;
      transaction: Transaction;
      result: Operation;
      source?: RouteProp<ParamListBase, ScreenName>;
    };
  };
  variant: keyof typeof VARIANTS;
}>;

export default function StacksValidationSuccess({ navigation, route, variant }: Props) {
  const { colors } = useTheme();
  const { account } = useAccountScreen(route);
  const { ticker } = getAccountCurrency(account);
  const { accountId, result, transaction } = route.params;
  const validator = transaction.valAddress;
  const source = route.params.source?.name ?? "unknown";
  const { event, delegation, category, action, titleKey, descriptionKey } = VARIANTS[variant];

  useEffect(() => {
    track(event, { currency: ticker, validator, source, delegation, flow: "stake" });
  }, [event, delegation, ticker, validator, source]);

  const onClose = useCallback(() => {
    navigation.pop();
  }, [navigation]);

  const onViewDetails = useCallback(() => {
    navigation.navigate(ScreenName.OperationDetails, { accountId, operation: result });
  }, [navigation, accountId, result]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category={category}
        name="ValidationSuccess"
        flow="stake"
        action={action}
        currency="stx"
      />
      <PreventNativeBack />
      <ValidateSuccess
        onClose={onClose}
        onViewDetails={onViewDetails}
        title={<Trans i18nKey={titleKey} />}
        description={<Trans i18nKey={descriptionKey} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
