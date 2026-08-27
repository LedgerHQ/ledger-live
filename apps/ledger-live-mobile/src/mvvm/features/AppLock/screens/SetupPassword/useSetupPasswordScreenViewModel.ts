import { useSetupPasswordViewModel, type SetupPasswordViewModel } from "@features/flow-app-lock";
import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { ScreenName } from "~/const";
import type { PasswordAddFlowNavigatorProps } from "../../types";

function useSetupPasswordScreenViewModel(): SetupPasswordViewModel {
  const navigation = useNavigation<PasswordAddFlowNavigatorProps["navigation"]>();

  const onValid = useCallback(() => {
    navigation.navigate(ScreenName.ConfirmPassword);
  }, [navigation]);

  return useSetupPasswordViewModel({ onValid });
}

export default useSetupPasswordScreenViewModel;
