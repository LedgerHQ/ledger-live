import React, { useCallback } from "react";
import { CompositeScreenProps } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import ValidateSuccess from "~/components/ValidateSuccess";
import { MinaStakingFlowParamList } from "./types";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useTranslation } from "react-i18next";
import {
  StackNavigatorProps,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";

type Props = CompositeScreenProps<
  StackNavigatorProps<MinaStakingFlowParamList, ScreenName.MinaStakingValidationSuccess>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

function StakingValidationSuccess({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account } = useSelector(accountScreenSelector(route));
  const { result } = route.params;

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>()?.pop();
  }, [navigation]);

  const goToOperationDetails = useCallback(() => {
    if (!account || !result) return;

    navigation.navigate(ScreenName.OperationDetails, {
      accountId: account.id,
      operation: result,
    });
  }, [account, result, navigation]);

  return (
    <ValidateSuccess
      onClose={onClose}
      onViewDetails={goToOperationDetails}
      title={t("mina.selectValidator.success.title")}
      description={t("mina.selectValidator.success.description")}
    />
  );
}

export default StakingValidationSuccess;
