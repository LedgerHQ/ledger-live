import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Platform } from "react-native";
import * as Keychain from "react-native-keychain";
import { selectHasPassword } from "@features/platform-app-lock";
import type { UnlockForCardNumbers } from "@features/flow-pay-card";
import { useTranslation } from "@shared/i18n";
import { NavigatorName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { useSelector } from "~/context/hooks";
import { privacySelector } from "~/reducers/settings";
import { usePasswordVerify } from "LLM/features/AppLock/hooks/usePasswordVerify";

export type CardNumbersUnlockSheetState = Readonly<{
  isOpen: boolean;
  error?: string;
  isBusy: boolean;
  onSubmit: (password: string) => void | Promise<void>;
  onClose: () => void;
}>;

type UnlockResolve = ((ok: boolean) => void) | null;

export function useUnlockForCardNumbers(): {
  unlock: UnlockForCardNumbers;
  sheet: CardNumbersUnlockSheetState;
} {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const appLockHasPassword = useSelector(selectHasPassword);
  const privacyHasPassword = Boolean(useSelector(privacySelector)?.hasPassword);
  const hasPassword = appLockHasPassword || privacyHasPassword;
  const verifyAppLock = usePasswordVerify();

  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);
  const resolveUnlockRef = useRef<UnlockResolve>(null);
  const awaitingCreateRef = useRef(false);
  const hasPasswordRef = useRef(hasPassword);

  hasPasswordRef.current = hasPassword;

  const finish = useCallback((ok: boolean) => {
    awaitingCreateRef.current = false;
    resolveUnlockRef.current?.(ok);
    resolveUnlockRef.current = null;
    setIsOpen(false);
    setError(undefined);
    setIsBusy(false);
  }, []);

  useEffect(() => {
    if (awaitingCreateRef.current && hasPassword) {
      finish(true);
    }
  }, [finish, hasPassword]);

  useEffect(() => {
    const unsubscribes: Array<() => void> = [];
    let current: typeof navigation | undefined = navigation;

    while (current) {
      unsubscribes.push(
        current.addListener("focus", () => {
          if (!awaitingCreateRef.current) {
            return;
          }
          finish(hasPasswordRef.current);
        }),
      );
      current = current.getParent();
    }

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
      resolveUnlockRef.current?.(false);
      resolveUnlockRef.current = null;
    };
  }, [finish, navigation]);

  const unlock = useCallback<UnlockForCardNumbers>(
    () =>
      new Promise(resolve => {
        resolveUnlockRef.current?.(false);
        resolveUnlockRef.current = resolve;
        setError(undefined);
        setIsBusy(false);

        if (hasPasswordRef.current) {
          setIsOpen(true);
          return;
        }

        awaitingCreateRef.current = true;
        navigation.navigate(NavigatorName.PasswordAddFlow);
      }),
    [navigation],
  );

  const onClose = useCallback(() => {
    if (isBusy) {
      return;
    }
    finish(false);
  }, [finish, isBusy]);

  const onSubmit = useCallback(
    async (password: string) => {
      if (isBusy) {
        return;
      }
      if (!password) {
        setError(t("payTab.card.numbers.passwordRequired"));
        return;
      }

      setIsBusy(true);
      try {
        const ok = appLockHasPassword
          ? await verifyAppLock(password)
          : await verifyLegacyPassword(password);
        if (!ok) {
          setError(t("payTab.card.numbers.passwordIncorrect"));
          return;
        }
        finish(true);
      } catch {
        setError(t("payTab.card.numbers.passwordUnavailable"));
      } finally {
        setIsBusy(false);
      }
    },
    [appLockHasPassword, finish, isBusy, t, verifyAppLock],
  );

  return {
    unlock,
    sheet: {
      isOpen,
      error,
      isBusy,
      onSubmit,
      onClose,
    },
  };
}

async function verifyLegacyPassword(password: string): Promise<boolean> {
  const options =
    Platform.OS === "ios" ? {} : { accessControl: Keychain.ACCESS_CONTROL.APPLICATION_PASSWORD };
  const credentials = await Keychain.getGenericPassword(options);
  return credentials?.password === password;
}
