import { useCallback, useEffect, useMemo, useRef } from "react";
import { Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFeature } from "@features/platform-feature-flags";
import { useCustomURI } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { GenericAwarenessModalLayout } from "@ledgerhq/live-common/genericAwarenessModal";
import { useDispatch, useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import {
  closeBackupHubFeatureIntro,
  openBackupHubFeatureIntro,
  selectBackupHubFeatureIntroDeeplinkNonce,
  selectIsBackupHubFeatureIntroOpen,
} from "~/reducers/backupHubFeatureIntro";
import type { FeatureIntroViewModel } from "LLM/components/FeatureIntroLayout/types";
import {
  trackBackupHubFeatureIntroButtonClicked,
  trackBackupHubFeatureIntroDismissed,
  trackBackupHubFeatureIntroViewed,
} from "../../analytics";

const BACKUP_HUB_FEATURE_INTRO_ID = "backup-hub-feature-intro";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const backupHubFeatureIntroImageUri = Image.resolveAssetSource(
  require("~/images/backup-hub-feature-intro.webp"),
).uri;

export type UseRecoverIntroDrawerViewModelResult = Readonly<{
  isOpen: boolean;
  bottomInset: number;
  featureIntroViewModel: FeatureIntroViewModel;
  onDismiss: () => void;
  onCloseFromCta: () => void;
}>;

export function useRecoverIntroDrawerViewModel(): UseRecoverIntroDrawerViewModelResult | null {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const lwmBackupHub = useFeature("lwmBackupHub");
  const recoverServices = useFeature("protectServicesMobile");
  const isLwmBackupHubEnabled = !!lwmBackupHub?.enabled;
  const isOpen = useSelector(selectIsBackupHubFeatureIntroOpen);
  const deeplinkNonce = useSelector(selectBackupHubFeatureIntroDeeplinkNonce);
  const hasTrackedViewRef = useRef(false);
  const hasClosedRef = useRef(false);
  const lastHandledDeeplinkNonceRef = useRef(0);

  const primaryButtonLink = useCustomURI(
    recoverServices,
    "upsell",
    "llm-backup-hub-feature-intro",
    "backup-hub-launch",
  );
  const secondaryButtonLink = useCustomURI(
    recoverServices,
    "login",
    "llm-backup-hub-feature-intro",
    "backup-hub-launch",
  );

  const content = useMemo(
    () => ({
      layout: GenericAwarenessModalLayout.FeatureIntro as const,
      id: BACKUP_HUB_FEATURE_INTRO_ID,
      imageUrl: backupHubFeatureIntroImageUri,
      title: t("backupHub.featureIntro.title"),
      subtitle: t("backupHub.featureIntro.subtitle"),
      primaryButtonLabel: t("backupHub.featureIntro.primaryCta"),
      primaryButtonLink: primaryButtonLink ?? "",
      secondaryButtonLabel: t("backupHub.featureIntro.secondaryCta"),
      secondaryButtonLink: secondaryButtonLink ?? "",
      items: [
        {
          icon: "IdCard",
          title: t("backupHub.featureIntro.items.secure.title"),
          subtitle: t("backupHub.featureIntro.items.secure.subtitle"),
        },
        {
          icon: "ShieldLock",
          title: t("backupHub.featureIntro.items.access.title"),
          subtitle: t("backupHub.featureIntro.items.access.subtitle"),
        },
        {
          icon: "LedgerDevices",
          title: t("backupHub.featureIntro.items.restore.title"),
          subtitle: t("backupHub.featureIntro.items.restore.subtitle"),
        },
      ],
      isReady: true,
    }),
    [primaryButtonLink, secondaryButtonLink, t],
  );

  const onPrimaryPress = useCallback(() => {
    trackBackupHubFeatureIntroButtonClicked({
      button: content.primaryButtonLabel,
      link: content.primaryButtonLink,
    });
  }, [content.primaryButtonLabel, content.primaryButtonLink]);

  const onSecondaryPress = useCallback(() => {
    trackBackupHubFeatureIntroButtonClicked({
      button: content.secondaryButtonLabel,
      link: content.secondaryButtonLink,
    });
  }, [content.secondaryButtonLabel, content.secondaryButtonLink]);

  const closeDrawer = useCallback(() => {
    if (hasClosedRef.current) {
      return;
    }
    hasClosedRef.current = true;
    dispatch(closeBackupHubFeatureIntro());
  }, [dispatch]);

  const onDismiss = useCallback(() => {
    if (hasClosedRef.current) {
      return;
    }
    trackBackupHubFeatureIntroDismissed();
    closeDrawer();
  }, [closeDrawer]);

  const onCloseFromCta = useCallback(() => {
    closeDrawer();
  }, [closeDrawer]);

  const featureIntroViewModel = useMemo(
    () => ({
      content,
      onPrimaryPress,
      onSecondaryPress,
    }),
    [content, onPrimaryPress, onSecondaryPress],
  );

  useEffect(() => {
    if (!isOpen) {
      hasTrackedViewRef.current = false;
      hasClosedRef.current = false;
      return;
    }

    if (!hasTrackedViewRef.current) {
      hasTrackedViewRef.current = true;
      trackBackupHubFeatureIntroViewed();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isLwmBackupHubEnabled) {
      closeDrawer();
    }
  }, [closeDrawer, isLwmBackupHubEnabled, isOpen]);

  useEffect(() => {
    if (deeplinkNonce === 0) {
      return;
    }
    if (deeplinkNonce === lastHandledDeeplinkNonceRef.current) {
      return;
    }
    if (!isLwmBackupHubEnabled) {
      return;
    }

    lastHandledDeeplinkNonceRef.current = deeplinkNonce;
    dispatch(openBackupHubFeatureIntro());
  }, [deeplinkNonce, dispatch, isLwmBackupHubEnabled]);

  if (!isLwmBackupHubEnabled) {
    return null;
  }

  return {
    isOpen,
    bottomInset: bottomInset + 20,
    featureIntroViewModel,
    onDismiss,
    onCloseFromCta,
  };
}
