import { useTranslation } from "@shared/i18n";
import { Android, Apple } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useGetCardStatusQuery } from "@domain/api-card-management";
import { getWalletPlatform } from "../getWalletPlatform.native";

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
  const { data } = useGetCardStatusQuery();

  const { brand, icon } = getWalletPlatform();

  return {
    // Only the provider answers this. A tenant that does not send the flag keeps offering the CTA,
    // which is the safe way round: adding a card already there costs the holder a tap.
    shouldRender: data?.cardAddedToDigitalWallet !== true,
    appearance,
    ctaLabel: t("payTab.card.addToWallet", { wallet: brand }),
    ctaIcon: WALLET_CTA_ICON[icon],
    onPressCta: onPress,
  };
}
