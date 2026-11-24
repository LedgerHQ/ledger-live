import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@shared/i18n";
import type {
  OfferedUpdate,
  UpdateOfferSheet,
  UpdateOfferSheetsProps,
} from "./UpdateOfferSheets.types";

type OfferPhase = "offer" | "confirmSkip" | "answered";

type OfferAnswer = Readonly<{ key: string; phase: OfferPhase }>;

export type OfferSheetViewProps = Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  updateLabel: string;
  onUpdate: () => void;
  onClose: () => void;
  onOpened: () => void;
}>;

export type SkipSheetViewProps = Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  updateLabel: string;
  skipLabel: string;
  onUpdate: () => void;
  onSkip: () => void;
  onDismiss: () => void;
  onOpened: () => void;
}>;

export type UpdateOfferSheetsViewProps = Readonly<{
  offer: OfferSheetViewProps;
  skip: SkipSheetViewProps;
}>;

function updateKey(update: OfferedUpdate | null) {
  return update ? `${update.current}|${update.available}` : null;
}

export function useUpdateOfferSheetsViewModel({
  update,
  confirmSkip,
  suspendSheets,
  onUpdate,
  onSkip,
  onTrack,
}: UpdateOfferSheetsProps): UpdateOfferSheetsViewProps {
  const { t } = useTranslation();
  const key = updateKey(update);
  const [answer, setAnswer] = useState<OfferAnswer | null>(null);
  const skippedKey = useRef<string | null>(null);
  const [shownUpdate, setShownUpdate] = useState(update);
  if (key === null && answer !== null) setAnswer(null);
  if (update && key !== updateKey(shownUpdate)) setShownUpdate(update);

  useEffect(() => {
    if (key === null) skippedKey.current = null;
  }, [key]);

  const startPhase: OfferPhase = confirmSkip ? "confirmSkip" : "offer";
  const phase = key !== null && answer?.key === key ? answer.phase : startPhase;
  const visible = key !== null && !suspendSheets;
  const shownSheet = visibleSheet(visible, phase);
  const offeredSheet = visibleSheet(key !== null, phase);
  const trackedSheet = useRef<UpdateOfferSheet | null>(null);

  useEffect(() => {
    if (!offeredSheet) trackedSheet.current = null;
  }, [offeredSheet]);

  // On open, not on request: the sheet queue can hold a sheet back or drop it before it shows.
  const reportOpened = (sheet: UpdateOfferSheet) => {
    const showsAgainAfterSuspend = trackedSheet.current === sheet;
    if (showsAgainAfterSuspend) return;
    trackedSheet.current = sheet;
    onTrack?.({ type: "shown", sheet });
  };

  const answerWith = (next: OfferPhase) => {
    if (key !== null) setAnswer({ key, phase: next });
  };
  const requestUpdate = (sheet: UpdateOfferSheet) => {
    onTrack?.({ type: "pressed", sheet, button: "update" });
    answerWith("offer");
    onUpdate();
  };
  const skip = () => {
    if (key === null || phase !== "confirmSkip" || skippedKey.current === key) return;
    skippedKey.current = key;
    onTrack?.({ type: "pressed", sheet: "confirmSkip", button: "skip" });
    answerWith("answered");
    onSkip();
  };

  return {
    offer: {
      isOpen: visible && phase === "offer",
      title: t("deviceOnboarding.setup.updateOffer.title"),
      description: [
        t("deviceOnboarding.setup.updateOffer.versions", {
          current: shownUpdate?.current ?? "",
          available: shownUpdate?.available ?? "",
        }),
        t("deviceOnboarding.setup.updateOffer.description"),
      ].join("\n\n"),
      updateLabel: t("deviceOnboarding.setup.updateOffer.updateCta"),
      onUpdate: () => requestUpdate("offer"),
      onClose: () => {
        if (shownSheet === "offer") onTrack?.({ type: "pressed", sheet: "offer", button: "close" });
        answerWith("confirmSkip");
      },
      onOpened: () => reportOpened("offer"),
    },
    skip: {
      isOpen: visible && phase === "confirmSkip",
      title: t("deviceOnboarding.setup.updateOffer.skip.title"),
      description: t("deviceOnboarding.setup.updateOffer.skip.description"),
      updateLabel: t("deviceOnboarding.setup.updateOffer.skip.updateCta"),
      skipLabel: t("deviceOnboarding.setup.updateOffer.skip.skipCta"),
      onUpdate: () => requestUpdate("confirmSkip"),
      onSkip: skip,
      onDismiss: () => {
        if (visible) skip();
      },
      onOpened: () => reportOpened("confirmSkip"),
    },
  };
}

function visibleSheet(visible: boolean, phase: OfferPhase): UpdateOfferSheet | null {
  if (!visible || phase === "answered") return null;
  return phase;
}
