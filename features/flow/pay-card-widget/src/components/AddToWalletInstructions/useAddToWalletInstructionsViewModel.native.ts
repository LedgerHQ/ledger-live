import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "@shared/i18n";
import { Android, Apple } from "@ledgerhq/lumen-ui-rnative/symbols";
import { getWalletPlatform } from "../getWalletPlatform.native";
import { markCardAddedToWallet } from "../../state";
import { openWalletApp } from "./openWalletApp";

type WalletPlatformIcon = typeof Apple;

const WALLET_CTA_ICON: Record<"Apple" | "Android", WalletPlatformIcon> = { Apple, Android };

export type AddToWalletInstructionsViewProps = {
  readonly title: string;
  readonly steps: readonly string[];
  readonly ctaLabel: string;
  readonly ctaIcon: WalletPlatformIcon;
  readonly onPressCta: () => void;
};

type Params = {
  onDone: () => void;
};

export function useAddToWalletInstructionsViewModel({
  onDone,
}: Params): AddToWalletInstructionsViewProps {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { i18nKey, icon } = getWalletPlatform();
  const ctaIcon = WALLET_CTA_ICON[icon];

  const onPressCta = useCallback(() => {
    dispatch(markCardAddedToWallet());
    onDone();
    void openWalletApp();
  }, [dispatch, onDone]);

  return {
    title: t(`payTab.cardOnboarding.addToWallet.${i18nKey}.title`),
    steps: [
      t(`payTab.cardOnboarding.addToWallet.${i18nKey}.step1`),
      t(`payTab.cardOnboarding.addToWallet.${i18nKey}.step2`),
      t(`payTab.cardOnboarding.addToWallet.${i18nKey}.step3`),
    ],
    ctaLabel: t(`payTab.cardOnboarding.addToWallet.${i18nKey}.cta`),
    ctaIcon,
    onPressCta,
  };
}
