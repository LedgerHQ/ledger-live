import { useCallback, useState } from "react";
import { useTranslation } from "@shared/i18n";
import { Android, Apple } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useGetCardStatusQuery } from "@domain/api-card-management";
import { getWalletPlatform } from "../getWalletPlatform.native";
import { openGoogleWalletStore, openWalletApp } from "./openWalletApp";

type WalletPlatformIcon = typeof Apple;

const WALLET_CTA_ICON: Record<"Apple" | "Android", WalletPlatformIcon> = { Apple, Android };

type InstructionsScene = {
  readonly scene: "instructions";
  readonly title: string;
  readonly steps: readonly string[];
  readonly ctaLabel: string;
  readonly ctaIcon: WalletPlatformIcon;
  readonly onPressCta: () => Promise<void>;
  readonly isPending: boolean;
};

type ErrorScene = {
  readonly scene: "error";
  readonly title: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly backLabel: string;
  readonly onPressAction: () => Promise<void>;
  readonly onBack: () => void;
  readonly isPending: boolean;
};

export type AddToWalletInstructionsViewProps = InstructionsScene | ErrorScene;

type Params = {
  onDone: () => void;
};

export function useAddToWalletInstructionsViewModel({
  onDone,
}: Params): AddToWalletInstructionsViewProps {
  const { t } = useTranslation();
  const { refetch } = useGetCardStatusQuery();
  const [scene, setScene] = useState<"instructions" | "error">("instructions");
  const [isPending, setIsPending] = useState(false);

  const { i18nKey, icon } = getWalletPlatform();
  const ctaIcon = WALLET_CTA_ICON[icon];

  const openWallet = useCallback(async () => {
    setIsPending(true);
    const opened = await openWalletApp();
    setIsPending(false);

    if (!opened) {
      setScene("error");
      return;
    }

    // Opening the wallet app is not the card being added: only the provider answers that, so ask
    // it again rather than recording a yes here. Its answer may lag the holder finishing.
    refetch();
    onDone();
  }, [refetch, onDone]);

  const openStore = useCallback(async () => {
    setIsPending(true);
    await openGoogleWalletStore();
    setIsPending(false);
  }, []);

  const showInstructions = useCallback(() => setScene("instructions"), []);

  if (scene === "error") {
    return {
      scene,
      title: t(`payTab.cardOnboarding.addToWallet.${i18nKey}.error.title`),
      description: t(`payTab.cardOnboarding.addToWallet.${i18nKey}.error.description`),
      actionLabel: t(`payTab.cardOnboarding.addToWallet.${i18nKey}.error.action`),
      backLabel: t("payTab.cardOnboarding.addToWallet.error.back"),
      onPressAction: i18nKey === "android" ? openStore : openWallet,
      onBack: showInstructions,
      isPending,
    };
  }

  return {
    scene,
    title: t(`payTab.cardOnboarding.addToWallet.${i18nKey}.title`),
    steps: [
      t(`payTab.cardOnboarding.addToWallet.${i18nKey}.step1`),
      t(`payTab.cardOnboarding.addToWallet.${i18nKey}.step2`),
      t(`payTab.cardOnboarding.addToWallet.${i18nKey}.step3`),
    ],
    ctaLabel: t(`payTab.cardOnboarding.addToWallet.${i18nKey}.cta`),
    ctaIcon,
    onPressCta: openWallet,
    isPending,
  };
}
