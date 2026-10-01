import React, { useEffect } from "react";
import { Trans } from "~/context/Locale";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { track } from "@shared/analytics";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import StacksValidationSuccess from "../shared/ValidationSuccess";
import type { StacksUnstakingFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<StacksUnstakingFlowParamList, ScreenName.StacksUnstakingValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  const { ticker } = getAccountCurrency(account);
  const validator = route.params.transaction.valAddress;
  const source = route.params.source?.name ?? "unknown";

  useEffect(() => {
    track("undelegation_completed", {
      currency: ticker,
      validator,
      source,
      delegation: "undelegation",
      flow: "stake",
    });
  }, [ticker, validator, source]);

  return (
    <StacksValidationSuccess
      navigation={navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()}
      accountId={route.params.accountId}
      result={route.params.result}
      category="StacksUnstakingFlow"
      flow="stake"
      action="undelegate"
      title={<Trans i18nKey="stacks.unstake.validation.success.title" />}
      description={<Trans i18nKey="stacks.unstake.validation.success.description" />}
    />
  );
}
