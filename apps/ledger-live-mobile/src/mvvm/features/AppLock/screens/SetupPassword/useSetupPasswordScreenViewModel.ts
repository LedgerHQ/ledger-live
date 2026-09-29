import { useSetupPasswordViewModel, type SetupPasswordViewModel } from "@features/flow-app-lock";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback } from "react";
import { ScreenName } from "~/const";
import type { PasswordAddFlowNavigatorProps } from "../../types";

function useSetupPasswordScreenViewModel(): SetupPasswordViewModel {
  const navigation = useNavigation<PasswordAddFlowNavigatorProps["navigation"]>();
  const { params } = useRoute<PasswordAddFlowNavigatorProps["route"]>();

  const onValid = useCallback(() => {
    navigation.navigate(ScreenName.ConfirmPassword, { source: params.source });
  }, [navigation, params.source]);

  return useSetupPasswordViewModel({ onValid });
}

export default useSetupPasswordScreenViewModel;
