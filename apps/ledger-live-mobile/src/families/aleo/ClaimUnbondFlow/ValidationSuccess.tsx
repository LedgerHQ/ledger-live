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
import type { AleoClaimUnbondFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<AleoClaimUnbondFlowParamList, ScreenName.AleoClaimUnbondValidationSuccess>
>;

export default function ValidationSuccess({ navigation, route }: Props) {
  const { account } = useAccountScreen(route);
  const { ticker } = getAccountCurrency(account);
  const staker = route.params.transaction.recipient;
  const source = route.params.source?.name ?? "unknown";

  useEffect(() => {
    track("staking_completed", {
      currency: ticker,
      staker,
      source,
      delegation: "claiming",
      flow: "claim",
    });
  }, [ticker, staker, source]);

  return (
    <AleoValidationSuccess
      navigation={navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()}
      accountId={route.params.accountId}
      result={route.params.result}
      category="ClaimUnbondFlow"
      flow="claim"
      action="claiming"
      title={<Trans i18nKey="aleo.claim.validation.success.title" />}
      description={<Trans i18nKey="aleo.claim.validation.success.description" />}
    />
  );
}
