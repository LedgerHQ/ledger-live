import {
  useProtectionPromptViewModel,
  type EnableProtectionSheetProps,
  type ProtectionEnabledSheetProps,
} from "@features/flow-app-lock";
import {
  getBiometricsAvailability,
  selectIsAppLockConfigured,
  type BiometricsAvailability,
} from "@features/platform-app-lock";
import { useNavigation } from "@react-navigation/native";
import type { RootNavigation } from "~/components/RootNavigator/types/helpers";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigatorName } from "~/const";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { useBiometricsSetup } from "../hooks/useBiometricsSetup";
import { useBiometricsTypeLabel } from "../hooks/useBiometricsTypeLabel";
import { useAppProtectionPromptState } from "./AppProtectionPromptProvider";
import { useIsRouteMounted } from "./internals/routePresence";
import type { AppProtectionRequest } from "./types";

type RequestScoped<T> = Readonly<{ request: AppProtectionRequest; value: T }>;

// The queue dismisses the keyboard whenever a sheet closes, so navigating while this one is still
// leaving would cost the password screen the keyboard it raises on arrival. The wait is bounded
// because the queue can settle a sheet closed without reporting it.
const SHEET_EXIT_MS = 400;

export type AppProtectionPromptViewModel = Readonly<{
  enableProtection: EnableProtectionSheetProps;
  protectionEnabled: ProtectionEnabledSheetProps;
}>;

export function useAppProtectionPromptViewModel(): AppProtectionPromptViewModel {
  const { t } = useTranslation();
  const navigation = useNavigation<RootNavigation>();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { request, settle } = useAppProtectionPromptState();
  const isProtected = useSelector(selectIsAppLockConfigured);
  const { enable } = useBiometricsSetup();
  const isPasswordFlowMounted = useIsRouteMounted(NavigatorName.PasswordAddFlow);

  const [probe, setProbe] = useState<RequestScoped<BiometricsAvailability> | null>(null);
  const [openedPasswordFlow, setOpenedPasswordFlow] = useState<RequestScoped<true> | null>(null);
  const hasSeenPasswordFlowRef = useRef(false);

  // Both are scoped to the request that produced them, so a new one starts from nothing without
  // an effect resetting anything.
  const biometrics = probe?.request === request ? probe.value : undefined;
  const isAskingForPassword = openedPasswordFlow?.request === request;

  useEffect(() => {
    if (!request) {
      return;
    }

    let isStale = false;

    getBiometricsAvailability()
      // A rejection would otherwise leave the prompt shut for good, with no trace.
      .catch(() => ({ status: "unavailable" }) as const)
      .then(value => {
        if (!isStale) {
          setProbe({ request, value });
        }
      });

    return () => {
      isStale = true;
    };
  }, [request]);

  // The flow pops itself once a password is stored, and the user can also leave it without one:
  // either way it goes, and what protection says by then decides whose turn it is.
  useEffect(() => {
    if (!isAskingForPassword) {
      return;
    }

    if (isPasswordFlowMounted) {
      hasSeenPasswordFlowRef.current = true;
      return;
    }

    if (!hasSeenPasswordFlowRef.current || isProtected) {
      return;
    }

    settle(false, request);
  }, [isAskingForPassword, isPasswordFlowMounted, isProtected, request, settle]);

  const biometricsKind = biometrics?.status === "available" ? biometrics.kind : undefined;
  const biometricsType = useBiometricsTypeLabel(biometricsKind);

  const onEnableBiometrics = useCallback(async () => {
    await enable({
      reason: t("appLock.biometrics.prompt", { biometricsType }),
      fallback: t("appLock.biometrics.useDeviceCredential"),
      cancel: t("common.cancel"),
    });
  }, [biometricsType, enable, t]);

  const pendingExitRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goToPasswordFlow = useCallback(() => {
    if (!pendingExitRef.current) {
      return;
    }

    clearTimeout(pendingExitRef.current);
    pendingExitRef.current = null;
    // Through Base, not by bare name: this host sits outside the navigators, and the flow is
    // registered inside Base, where a root-level name would not reach it.
    navigation.navigate(NavigatorName.Base, { screen: NavigatorName.PasswordAddFlow });
  }, [navigation]);

  useEffect(
    () => () => {
      if (pendingExitRef.current) {
        clearTimeout(pendingExitRef.current);
      }
    },
    [],
  );

  const onCreatePassword = useCallback(() => {
    if (!request) {
      return;
    }

    hasSeenPasswordFlowRef.current = false;
    setOpenedPasswordFlow({ request, value: true });
    pendingExitRef.current = setTimeout(goToPasswordFlow, SHEET_EXIT_MS);
  }, [goToPasswordFlow, request]);

  // Closing is only the user's answer while the prompt is what is on screen: it also fires when
  // the password flow takes over, and when protection arrives and the success sheet replaces it.
  const onDismiss = useCallback(() => {
    if (!isAskingForPassword && !isProtected) {
      settle(false, request);
    }
  }, [isAskingForPassword, isProtected, request, settle]);

  const enableProtection = useProtectionPromptViewModel({
    isRequested: request !== null && !isAskingForPassword,
    isProtected,
    biometrics,
    onEnableBiometrics,
    onCreatePassword,
    onDismiss,
  });

  const onContinue = useCallback(() => settle(true, request), [request, settle]);
  const onSuccessClose = useCallback(() => settle(false, request), [request, settle]);

  return {
    enableProtection: {
      ...enableProtection,
      reason: request?.reason,
      bottomInset,
      onHidden: goToPasswordFlow,
    },
    protectionEnabled: {
      isOpen: request !== null && isProtected,
      variant: enableProtection.variant,
      biometricsKind,
      reason: request?.successReason,
      bottomInset,
      onContinue,
      onClose: onSuccessClose,
    },
  };
}
