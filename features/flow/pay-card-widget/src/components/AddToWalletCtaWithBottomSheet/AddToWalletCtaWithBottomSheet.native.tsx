import React, { useCallback, useState } from "react";
import { trackButtonClicked } from "@features/platform-pay-analytics";
import { AddToWalletBottomSheet } from "../AddToWalletBottomSheet/AddToWalletBottomSheet.native";
import { AddToWalletCta, type AddToWalletCtaProps } from "../AddToWalletCta/AddToWalletCta.native";
import { getWalletPlatform } from "../getWalletPlatform.native";

type Props = Pick<AddToWalletCtaProps, "appearance">;

export function AddToWalletCtaWithBottomSheet({ appearance }: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const openSheet = useCallback(() => {
    trackButtonClicked({
      button: `add to ${getWalletPlatform().brand.toLowerCase()} pay`,
      page: "Pay",
    });
    setIsSheetOpen(true);
  }, []);
  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  return (
    <>
      <AddToWalletCta appearance={appearance} onPress={openSheet} />
      <AddToWalletBottomSheet isOpen={isSheetOpen} onClose={closeSheet} />
    </>
  );
}
