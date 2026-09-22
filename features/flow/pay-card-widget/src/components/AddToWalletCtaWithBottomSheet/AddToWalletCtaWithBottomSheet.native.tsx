import React, { useCallback, useState } from "react";
import { AddToWalletBottomSheet } from "../AddToWalletBottomSheet/AddToWalletBottomSheet.native";
import { AddToWalletCta, type AddToWalletCtaProps } from "../AddToWalletCta/AddToWalletCta.native";

type Props = Pick<AddToWalletCtaProps, "appearance">;

export function AddToWalletCtaWithBottomSheet({ appearance }: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const openSheet = useCallback(() => setIsSheetOpen(true), []);
  const closeSheet = useCallback(() => setIsSheetOpen(false), []);

  return (
    <>
      <AddToWalletCta appearance={appearance} onPress={openSheet} />
      <AddToWalletBottomSheet isOpen={isSheetOpen} onClose={closeSheet} />
    </>
  );
}
