import React, { useEffect } from "react";
import { Trans } from "~/context/Locale";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { track } from "~/analytics";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import AleoValidationSuccess from "../shared/ValidationSuccess";
import type { AleoUnbondFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<AleoUnbondFlowParamList, ScreenName.AleoUnbondValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  const { ticker } = getAccountCurrency(account);
  const source = route.params.source?.name ?? "unknown";

  useEffect(() => {
    track("staking_unbond_completed", {
      currency: ticker,
      source,
      flow: "unbond",
    });
  }, [ticker, source]);

  return (
    <AleoValidationSuccess
      navigation={navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()}
      accountId={route.params.accountId}
      result={route.params.result}
      category="UnbondFlow"
      flow="unbond"
      action="unbonding"
      title={<Trans i18nKey="aleo.unbond.validation.success.title" />}
      description={<Trans i18nKey="aleo.unbond.validation.success.description" />}
    />
  );
}
