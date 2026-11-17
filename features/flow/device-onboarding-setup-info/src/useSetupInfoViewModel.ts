import { useState } from "react";
import { Linking, type ImageSourcePropType } from "react-native";
import { useTranslation } from "@shared/i18n";
import type { SetupInfoCard, SetupInfoProps } from "./SetupInfo.types";
import { setupInfoUrls } from "./urls";
import secretRecoveryPhraseImage from "./assets/secret-recovery-phrase.webp";
import recoveryKeyImage from "./assets/recovery-key-card.webp";

export type InfoSheetIllustration = Readonly<{
  kind: "recoveryPhrase" | "recoveryKey";
  source: ImageSourcePropType;
}>;

export type InfoSheetRow = Readonly<{ title: string; description: string }>;

export type InfoCardProps = Readonly<{ title: string; onPress: () => void }>;

export type InfoSheetProps = Readonly<{
  isOpen: boolean;
  title?: string;
  illustration?: InfoSheetIllustration;
  rows: readonly InfoSheetRow[];
  paragraphs: readonly string[];
  linkLabel: string;
  onOpenLink: () => void;
  onClose: () => void;
}>;

export type SetupInfoViewProps = Readonly<{
  infoCard: InfoCardProps | null;
  infoSheet: InfoSheetProps | null;
}>;

type Translate = ReturnType<typeof useTranslation>["t"];

type InfoSheetKind = "setupChoice" | "recoveryPhrase" | "restoreChoice" | "recoveryKey";

type InfoSheetContent = Omit<InfoSheetProps, "isOpen" | "onOpenLink" | "onClose">;

const sheetByCard = {
  setupChoice: "setupChoice",
  recoveryPhrase: "recoveryPhrase",
  restoreChoice: "restoreChoice",
  recoveryKey: "recoveryKey",
  restoreRecoveryKey: "recoveryKey",
} as const satisfies Record<SetupInfoCard, InfoSheetKind>;

const linkBySheet = {
  setupChoice: setupInfoUrls.faq,
  recoveryPhrase: setupInfoUrls.recoveryPhrase,
  restoreChoice: setupInfoUrls.faq,
  recoveryKey: setupInfoUrls.faq,
} as const satisfies Record<InfoSheetKind, string>;

function cardTitle(t: Translate, card: SetupInfoCard) {
  return t(`deviceOnboarding.setup.info.cards.${card}`);
}

function sheetContent(
  t: Translate,
  sheet: InfoSheetKind,
  reportsRecoveryKey: boolean,
): InfoSheetContent {
  const faqLabel = t("deviceOnboarding.setup.info.faq");
  switch (sheet) {
    case "setupChoice":
      return {
        title: t("deviceOnboarding.setup.info.setupChoice.title"),
        rows: [
          {
            title: t("deviceOnboarding.setup.info.setupChoice.newDevice.title"),
            description: t("deviceOnboarding.setup.info.setupChoice.newDevice.description"),
          },
          {
            title: t("deviceOnboarding.setup.info.setupChoice.restore.title"),
            description: t("deviceOnboarding.setup.info.setupChoice.restore.description"),
          },
        ],
        paragraphs: [],
        linkLabel: faqLabel,
      };
    case "recoveryPhrase":
      return {
        title: t("deviceOnboarding.setup.info.recoveryPhrase.title"),
        illustration: { kind: "recoveryPhrase", source: secretRecoveryPhraseImage },
        rows: [],
        paragraphs: [t("deviceOnboarding.setup.info.recoveryPhrase.description")],
        linkLabel: faqLabel,
      };
    case "restoreChoice":
      return {
        rows: [
          {
            title: t("deviceOnboarding.setup.info.restoreChoice.recoveryPhrase.title"),
            description: t("deviceOnboarding.setup.info.restoreChoice.recoveryPhrase.description"),
          },
          ...(reportsRecoveryKey
            ? [
                {
                  title: t("deviceOnboarding.setup.info.restoreChoice.recoveryKey.title"),
                  description: t(
                    "deviceOnboarding.setup.info.restoreChoice.recoveryKey.description",
                  ),
                },
              ]
            : []),
          {
            title: t("deviceOnboarding.setup.info.restoreChoice.recover.title"),
            description: t("deviceOnboarding.setup.info.restoreChoice.recover.description"),
          },
        ],
        paragraphs: [],
        linkLabel: faqLabel,
      };
    case "recoveryKey":
      return {
        title: t("deviceOnboarding.setup.info.recoveryKey.title"),
        illustration: { kind: "recoveryKey", source: recoveryKeyImage },
        rows: [],
        paragraphs: [
          t("deviceOnboarding.setup.info.recoveryKey.description"),
          t("deviceOnboarding.setup.info.recoveryKey.inTheBox"),
        ],
        linkLabel: t("deviceOnboarding.setup.info.recoveryKey.learnHowToUse"),
      };
  }
}

function openUrl(url: string) {
  Linking.openURL(url).catch(() => undefined);
}

export function useSetupInfoViewModel({
  card,
  suspendSheets,
  reportsRecoveryKey,
}: SetupInfoProps): SetupInfoViewProps {
  const { t } = useTranslation();
  const [openedCard, setOpenedCard] = useState<SetupInfoCard | null>(null);
  const [shownCard, setShownCard] = useState(card);

  if (card !== shownCard) {
    setShownCard(card);
    setOpenedCard(null);
  }

  if (!card) return { infoCard: null, infoSheet: null };

  const sheet = sheetByCard[card];

  return {
    infoCard: { title: cardTitle(t, card), onPress: () => setOpenedCard(card) },
    infoSheet: {
      ...sheetContent(t, sheet, reportsRecoveryKey),
      isOpen: openedCard === card && !suspendSheets,
      onOpenLink: () => openUrl(linkBySheet[sheet]),
      onClose: () => {
        if (!suspendSheets) setOpenedCard(null);
      },
    },
  };
}
