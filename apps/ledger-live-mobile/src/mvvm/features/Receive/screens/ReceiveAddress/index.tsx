import React, { useCallback } from "react";
import { ReceiveAddress } from "@features/flow-receive";
import type { ScreenName } from "~/const";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ReceiveNavigatorParamList } from "~/components/RootNavigator/types/ReceiveNavigator";

type Props = StackNavigatorProps<ReceiveNavigatorParamList, ScreenName.ReceiveAddress>;

export default function ReceiveAddressScreen({ navigation, route }: Props) {
  const onClose = useCallback(() => navigation.getParent()?.goBack(), [navigation]);
  return (
    <ReceiveAddress
      accountUUID={route.params.accountUUID}
      assetId={route.params.assetId}
      onClose={onClose}
    />
  );
}
