import { track } from "@shared/analytics";
import React, { useEffect } from "react";
import { Trans } from "~/context/Locale";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import AleoValidationSuccess from "../shared/ValidationSuccess";
import type { AleoBondPublicFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<AleoBondPublicFlowParamList, ScreenName.AleoBondPublicValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  const { ticker } = getAccountCurrency(account);
  const validator = route.params.transaction.recipient;
  const source = route.params.source?.name ?? "unknown";

  useEffect(() => {
    track("staking_completed", {
      currency: ticker,
      validator,
      source,
      // Aleo has a single delegation type: bonding to a validator.
      delegation: "delegation",
      flow: "stake",
    });
  }, [ticker, validator, source]);

  return (
    <AleoValidationSuccess
      navigation={navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()}
      accountId={route.params.accountId}
      result={route.params.result}
      category="BondPublicFlow"
      flow="stake"
      action="bond"
      title={<Trans i18nKey="aleo.bond.validation.success.title" />}
      description={<Trans i18nKey="aleo.bond.validation.success.description" />}
    />
  );
}
