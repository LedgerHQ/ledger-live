import { useSelector } from "react-redux";
import { useTranslation } from "@shared/i18n";
import { Android, Apple } from "@ledgerhq/lumen-ui-rnative/symbols";
import { getWalletPlatform } from "../getWalletPlatform.native";
import { selectHasAddedCardToWallet } from "../../state";

export type AddToWalletCtaAppearance = "base" | "gray";

type WalletPlatformIcon = typeof Apple;

const WALLET_CTA_ICON: Record<"Apple" | "Android", WalletPlatformIcon> = { Apple, Android };

export type AddToWalletCtaViewProps = {
  readonly shouldRender: boolean;
  readonly appearance: AddToWalletCtaAppearance;
  readonly ctaLabel: string;
  readonly ctaIcon: WalletPlatformIcon;
  readonly onPressCta: () => void;
};

type Params = {
  appearance: AddToWalletCtaAppearance;
  onPress: () => void;
};

export function useAddToWalletCtaViewModel({
  appearance,
  onPress,
}: Params): AddToWalletCtaViewProps {
  const { t } = useTranslation();
  const hasAddedCardToWallet = useSelector(selectHasAddedCardToWallet);

  const { brand, icon } = getWalletPlatform();

  return {
    shouldRender: !hasAddedCardToWallet,
    appearance,
    ctaLabel: t("payTab.card.addToWallet", { wallet: brand }),
    ctaIcon: WALLET_CTA_ICON[icon],
    onPressCta: onPress,
  };
}
