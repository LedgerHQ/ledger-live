import React, { memo, useCallback, useState } from "react";
import * as Keychain from "react-native-keychain";
import { PasswordsDontMatchError } from "@ledgerhq/errors";
import { Vibration } from "react-native";
import { useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { disablePrivacy } from "~/actions/settings";
import PasswordForm from "./PasswordForm";
import { VIBRATION_PATTERN_ERROR } from "~/utils/constants";
import { ScreenName } from "~/const";
import type { PasswordModifyFlowParamList } from "~/components/RootNavigator/types/PasswordModifyFlowNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type NavigationProps = StackNavigatorProps<PasswordModifyFlowParamList, ScreenName.PasswordRemove>;

const PasswordRemove = ({ navigation }: NavigationProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [error, setError] = useState<Error | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");

  const onChange = useCallback((password: string) => {
    setConfirmPassword(password);
    setError(null);
  }, []);

  const submit = useCallback(async () => {
    if (!confirmPassword) return;

    try {
      const credentials = await Keychain.getGenericPassword();
      if (credentials) {
        if (credentials.password !== confirmPassword) {
          Vibration.vibrate(VIBRATION_PATTERN_ERROR);
          throw new PasswordsDontMatchError();
        }

        await Keychain.resetGenericPassword();
      }

      dispatch(disablePrivacy());

      const parentNavigation = navigation.getParent();
      if (parentNavigation) parentNavigation.goBack();
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Could not remove password"));
      setConfirmPassword("");
    }
  }, [confirmPassword, dispatch, navigation]);

  const onSubmit = useCallback(() => {
    submit();
  }, [submit]);

  return (
    <PasswordForm
      placeholder={t("auth.confirmPassword.placeholder")}
      onChange={onChange}
      onSubmit={onSubmit}
      error={error}
      value={confirmPassword}
    />
  );
};

export default memo(PasswordRemove);
