import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { cardManagementApi } from "@domain/api-card-management";
import { useCardAuthStatus } from "@features/flow-pay-card-auth";
import { useCardWalletsTotal } from "@features/flow-pay-card-assets";
import {
  useCardOnboardingStatus,
  type UseCardOnboardingStatusResult,
} from "@features/flow-pay-card-widget/onboarding-status";
import { useTranslation } from "@shared/i18n";
import type { CardDisplayState, CardPrimaryAction, CardProps, CardViewProps } from "./Card.types";
import { useCardLifecycleTracking } from "./useCardLifecycleTracking";
import { useCardStatusRefresh } from "./useCardStatusRefresh";

const CARD_ORDER_TAGS = ["CardStatus", "CardTransactions", "CardLinkedWallets"] as const;

function currentChooseCardType(
  onboarding: UseCardOnboardingStatusResult,
  onChooseCardType: (() => void) | undefined,
): (() => void) | undefined {
  if (
    !onChooseCardType ||
    onboarding.isLoading ||
    onboarding.isError ||
    onboarding.hasSourceError
  ) {
    return undefined;
  }

  const currentStep = onboarding.data.steps.find(step => !step.isDone);

  return currentStep?.id === "choose-card-type" ? onChooseCardType : undefined;
}

function cardPrimaryAction(
  chooseCardType: (() => void) | undefined,
  onTopUp: (() => void) | undefined,
  chooseCardTypeLabel: string,
  topUpLabel: string,
): CardPrimaryAction | undefined {
  if (chooseCardType) {
    return { label: chooseCardTypeLabel, onPress: chooseCardType };
  }

  if (onTopUp) {
    return { label: topUpLabel, onPress: onTopUp };
  }

  return undefined;
}

export function useCardViewModel({
  login,
  assets,
  formatters,
  onShowMore,
  onTopUp,
  onChooseCardType,
  onViewRewards,
  cardSettingsActions,
  discreet,
}: CardProps): CardViewProps {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  useCardLifecycleTracking();
  const status = useCardAuthStatus();
  const displayState: CardDisplayState = status === "unknown" ? "resolving" : status;
  const isSignedIn = status === "signedIn";
  useCardStatusRefresh({ skip: !isSignedIn });
  const formatCountervalue = formatters?.countervalue;
  const balanceLabel = t("payTab.card.balanceLabel");
  const { total, isLoading, isError } = useCardWalletsTotal(assets, isSignedIn);
  const onboarding = useCardOnboardingStatus({ skip: !isSignedIn });
  // The card is ordered on the hosted page, outside any of our mutations, so nothing invalidates
  // the missing card status: it is invalidated once that page hands back. Tags, not `refetch`,
  // because the hooks that could refetch may have unmounted by then.
  const chooseCardTypeThenRefresh = useMemo(
    () =>
      onChooseCardType
        ? () =>
            void Promise.resolve(onChooseCardType()).finally(() =>
              dispatch(cardManagementApi.util.invalidateTags([...CARD_ORDER_TAGS])),
            )
        : undefined,
    [onChooseCardType, dispatch],
  );
  const chooseCardType = currentChooseCardType(onboarding, chooseCardTypeThenRefresh);

  const cardVisual = useMemo<CardViewProps["cardVisual"]>(() => {
    if (!formatCountervalue) return undefined;

    if (displayState === "resolving") {
      return { balance: 0, formatCountervalue, balanceLabel, isLoading: true, discreet };
    }

    if (!isSignedIn || assets === undefined || isError) return undefined;

    return { balance: total, formatCountervalue, balanceLabel, isLoading, discreet };
  }, [
    displayState,
    isSignedIn,
    formatCountervalue,
    balanceLabel,
    assets,
    total,
    isLoading,
    isError,
    discreet,
  ]);

  return {
    title: t("payTab.card.title"),
    disclaimer: t("payTab.disclaimer"),
    login,
    displayState,
    cardVisual,
    assets,
    formatters,
    onShowMore,
    onTopUp,
    onChooseCardType: chooseCardTypeThenRefresh,
    primaryAction: cardPrimaryAction(
      chooseCardType,
      onTopUp,
      t("payTab.card.chooseCardType"),
      t("payTab.card.topUp"),
    ),
    cardState: chooseCardType ? "choosingCardType" : "ready",
    onViewRewards,
    cardSettingsActions,
  };
}
