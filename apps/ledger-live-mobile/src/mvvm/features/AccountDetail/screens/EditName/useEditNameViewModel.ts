import { useCallback, useMemo, useState } from "react";
import { Platform, type KeyboardAvoidingViewProps } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import { MAX_ACCOUNT_NAME_LENGTH, validateNameEdition } from "@domain/entity-account-name";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useDispatch } from "~/context/hooks";
import { updateAccount } from "~/actions/accounts";
import { setAccountName, useMaybeAccountName } from "~/reducers/wallet";
import { shouldUseKeyboardAvoidance } from "~/logic/keyboardVisible";
import type { ScreenName } from "~/const";
import type { AccountDetailNavigatorParamsList } from "../../types";

type EditNameRoute = RouteProp<AccountDetailNavigatorParamsList, ScreenName.AccountDetailEditName>;

export type EditNameViewModel = Readonly<{
  account: Account | undefined;
  name: string;
  maxLength: number;
  isSubmitDisabled: boolean;
  keyboardBehavior: KeyboardAvoidingViewProps["behavior"];
  onChangeName: (name: string) => void;
  onClearName: () => void;
  onSubmit: () => void;
}>;

export function useEditNameViewModel(): EditNameViewModel {
  const route = useRoute<EditNameRoute>();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { account } = useAccountScreen(route);
  const mainAccount = account?.type === "Account" ? account : undefined;
  const currentName = useMaybeAccountName(mainAccount) ?? "";
  const [name, setName] = useState(currentName);

  const isSubmitDisabled = useMemo(() => {
    const trimmed = name.trim();
    return !trimmed || trimmed === currentName;
  }, [name, currentName]);

  const onClearName = useCallback(() => setName(""), []);

  const onSubmit = useCallback(() => {
    if (!mainAccount || isSubmitDisabled) return;
    dispatch(updateAccount(mainAccount));
    dispatch(setAccountName(mainAccount.id, validateNameEdition(mainAccount, name)));
    navigation.goBack();
  }, [mainAccount, isSubmitDisabled, dispatch, name, navigation]);

  return {
    account: mainAccount,
    name,
    maxLength: MAX_ACCOUNT_NAME_LENGTH,
    isSubmitDisabled,
    keyboardBehavior: shouldUseKeyboardAvoidance(Platform.OS, Platform.Version)
      ? "padding"
      : undefined,
    onChangeName: setName,
    onClearName,
    onSubmit,
  };
}
