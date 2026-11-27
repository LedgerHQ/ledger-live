import React, { useCallback } from "react";
import { ReceiveAddress } from "@features/flow-receive";
import type { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ReceiveNavigatorParamList } from "~/components/RootNavigator/types/ReceiveNavigator";
import { useReceiveAddressScreenViewModel } from "./useReceiveAddressScreenViewModel";

type Props = StackNavigatorProps<ReceiveNavigatorParamList, ScreenName.ReceiveAddress>;

export default function ReceiveAddressScreen({ navigation, route }: Props) {
  const onClose = useCallback(() => navigation.getParent()?.goBack(), [navigation]);
  const receiveAddress = useReceiveAddressScreenViewModel({
    accountUUID: route.params.accountUUID,
    assetId: route.params.assetId,
    source: route.params.source,
    onClose,
  });

  return <ReceiveAddress {...receiveAddress} />;
}
