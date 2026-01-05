import { CompositeScreenProps } from "@react-navigation/native";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import ValidateSuccess from "~/components/ValidateSuccess";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/store";
import { accountScreenSelector } from "~/reducers/accounts";
import { MinaStakingFlowParamList } from "./types";

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
