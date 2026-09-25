import React, { useCallback } from "react";
import type { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { ScreenName } from "~/const";
import { CardTopUpSignedView } from "./CardTopUpSignedView";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PayCardTopUpSigned>
>;

export default function CardTopUpSignedScreen({ navigation }: NavigationProps) {
  const onClose = useCallback(() => navigation.goBack(), [navigation]);
  return <CardTopUpSignedView onClose={onClose} />;
}
