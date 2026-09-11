import { useState } from "react";
import { useTranslation } from "@shared/i18n";
import { useFreezeCardViewModel } from "../Freeze/useFreezeCardViewModel";
import { useMoreViewModel } from "../More/useMoreViewModel";
import { useCardDetailsNavigation } from "./Scenes/navigation";
import type { CardDetailsSceneProps } from "./Scenes/types";
import type { CardDetailsProps, CardDetailsViewProps } from "../../types";

export function useCardDetailsViewModel({ cardVisual }: CardDetailsProps): CardDetailsViewProps {
  const { t } = useTranslation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { route, goTo, goBack } = useCardDetailsNavigation();
  const freezeViewModel = useFreezeCardViewModel(goBack);
  const moreViewModel = useMoreViewModel();

  const onFreezePress = () => {
    freezeViewModel.onOpenConfirm();
    goTo({ name: "freeze" });
  };

  const onMorePress = () => {
    goTo({ name: "more" });
  };

  const openSheet = () => {
    goBack();
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    freezeViewModel.onClose();
    moreViewModel?.onSheetClose();
    goBack();
    setIsSheetOpen(false);
  };

  const scene: CardDetailsSceneProps = {
    route,
    overview: { cardVisual, freezeViewModel, moreViewModel, onFreezePress, onMorePress },
    freeze: { viewModel: freezeViewModel },
    more: moreViewModel ? { viewModel: moreViewModel } : null,
  };

  return {
    cardVisual,
    placeholderLabel: t("payTab.card.placeholder"),
    detailsLabel: t("payTab.card.details"),
    isSheetOpen,
    scene,
    onDetailsPress: openSheet,
    onSheetClose: closeSheet,
  };
}
