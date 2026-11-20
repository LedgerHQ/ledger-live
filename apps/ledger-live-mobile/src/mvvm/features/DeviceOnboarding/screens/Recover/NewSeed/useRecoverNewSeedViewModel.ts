import { useState } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { useTranslation } from "~/context/Locale";

export type RecoverNewSeedScreenProps = Readonly<{
  suspendSheets?: boolean;
  onSkip: () => void;
  onRemindLater: () => void;
  onOpenLiveApp: () => void;
  onClose: () => void;
}>;

export type RecoverSheetPoint = Readonly<{
  id: "identity" | "security" | "legacy";
  title: string;
  description: string;
}>;

export type RecoverDetailSheet = Readonly<{
  title: string;
  points: readonly RecoverSheetPoint[];
  startLabel: string;
  remindLabel: string;
  onStart: () => void;
  onRemind: () => void;
  onClose: () => void;
}>;

export type RecoverNewSeedViewProps = Readonly<{
  phrases: readonly string[];
  tapLabel: string;
  closeLabel: string;
  title: string;
  description: string;
  price: string;
  protectLabel: string;
  skipLabel: string;
  onProtect: () => void;
  onSkip: () => void;
  onClose: () => void;
  sheet: RecoverDetailSheet | null;
}>;

export function useRecoverNewSeedViewModel({
  suspendSheets = false,
  onSkip,
  onRemindLater,
  onOpenLiveApp,
  onClose,
}: RecoverNewSeedScreenProps): RecoverNewSeedViewProps {
  const { t } = useTranslation();
  const detailFlag = useFeature("recoverDetailedDrawerOnboarding");
  const showsDetail = detailFlag?.enabled === true;
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return {
    phrases: [
      t("deviceOnboarding.karaoke.recover.tooManyBackups"),
      t("deviceOnboarding.karaoke.recover.encryptedBackup"),
      t("deviceOnboarding.karaoke.recover.thereWhenYouNeedIt"),
    ],
    tapLabel: t("deviceOnboarding.karaoke.tapToContinue"),
    closeLabel: t("deviceOnboarding.checks.close"),
    title: t("deviceOnboarding.karaoke.recover.title"),
    description: t("deviceOnboarding.karaoke.recover.description"),
    price: t("deviceOnboarding.karaoke.recover.price"),
    protectLabel: t("deviceOnboarding.karaoke.recover.protect"),
    skipLabel: t("deviceOnboarding.karaoke.recover.skip"),
    onProtect: () => {
      if (showsDetail) setIsSheetOpen(true);
      else onOpenLiveApp();
    },
    onSkip,
    onClose,
    sheet:
      showsDetail && isSheetOpen && !suspendSheets
        ? {
            title: t("deviceOnboarding.karaoke.recover.sheet.title"),
            points: [
              {
                id: "identity",
                title: t("deviceOnboarding.karaoke.recover.sheet.identity.title"),
                description: t("deviceOnboarding.karaoke.recover.sheet.identity.description"),
              },
              {
                id: "security",
                title: t("deviceOnboarding.karaoke.recover.sheet.security.title"),
                description: t("deviceOnboarding.karaoke.recover.sheet.security.description"),
              },
              {
                id: "legacy",
                title: t("deviceOnboarding.karaoke.recover.sheet.legacy.title"),
                description: t("deviceOnboarding.karaoke.recover.sheet.legacy.description"),
              },
            ],
            startLabel: t("deviceOnboarding.karaoke.recover.sheet.start"),
            remindLabel: t("deviceOnboarding.karaoke.recover.sheet.remindLater"),
            onStart: onOpenLiveApp,
            onRemind: onRemindLater,
            onClose: () => setIsSheetOpen(false),
          }
        : null,
  };
}
