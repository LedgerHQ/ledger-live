import React, { useCallback } from "react";
import { StackActions } from "@react-navigation/native";
import { ReceiveAddress } from "@features/flow-receive";
import { NavigatorName, ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ReceiveNavigatorParamList } from "~/components/RootNavigator/types/ReceiveNavigator";
import type { ReceiveConfirmationParams } from "../../utils/getReceiveRoute";
import { useReceiveAddressScreenViewModel } from "./useReceiveAddressScreenViewModel";

type Props = StackNavigatorProps<ReceiveNavigatorParamList, ScreenName.ReceiveAddress>;

export default function ReceiveAddressScreen({ navigation, route }: Props) {
  const onClose = useCallback(() => navigation.getParent()?.goBack(), [navigation]);
  const openLegacyReceive = useCallback(
    (params: ReceiveConfirmationParams) =>
      navigation.getParent()?.dispatch(
        StackActions.replace(NavigatorName.ReceiveFunds, {
          screen: ScreenName.ReceiveConfirmation,
          params,
        }),
      ),
    [navigation],
  );
  const receiveAddress = useReceiveAddressScreenViewModel({
    accountUUID: route.params.accountUUID,
    assetId: route.params.assetId,
    onClose,
    openLegacyReceive,
  });

  return <ReceiveAddress {...receiveAddress} />;
}
