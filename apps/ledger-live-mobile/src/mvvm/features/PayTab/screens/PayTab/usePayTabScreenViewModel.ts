import { useEffect } from "react";
import { closePayCard, selectPayCardLoginUrl } from "@domain/entity-pay-card";
import { useNavigation } from "@react-navigation/core";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import { useDispatch, useSelector } from "~/context/hooks";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { PayTabNavigatorParamList } from "../../types";

const PAY_CARD_MANIFEST_ID = "cl-card";

type BaseNavigatorNavigation = NativeStackNavigationProp<
  BaseNavigatorStackParamList,
  keyof BaseNavigatorStackParamList,
  typeof BASE_NAVIGATOR_ID
>;

type Navigation = CompositeNavigationProp<
  NativeStackNavigationProp<PayTabNavigatorParamList>,
  BaseNavigatorNavigation
>;

export type PayTabScreenViewModel = {
  readonly top: number;
};

export function usePayTabScreenViewModel(): PayTabScreenViewModel {
  const navigation = useNavigation<Navigation>();
  const dispatch = useDispatch();
  const loginUrl = useSelector(selectPayCardLoginUrl);
  const { top } = useNavigationBarHeights();

  useEffect(() => {
    if (!loginUrl) {
      return;
    }

    const baseNavigation = navigation.getParent<BaseNavigatorNavigation>(BASE_NAVIGATOR_ID);

    baseNavigation?.push(NavigatorName.Web3Hub, {
      screen: ScreenName.Web3HubApp,
      params: {
        manifestId: PAY_CARD_MANIFEST_ID,
      },
    });

    // The login URL carries short-lived OAuth material, so it is cleared even when the
    // hand-off could not happen rather than being left in the store.
    dispatch(closePayCard());
  }, [dispatch, loginUrl, navigation]);

  return { top };
}
