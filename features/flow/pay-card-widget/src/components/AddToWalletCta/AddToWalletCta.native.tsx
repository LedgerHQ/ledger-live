import React from "react";
import { AddToWalletCtaView } from "./AddToWalletCtaView.native";
import {
  useAddToWalletCtaViewModel,
  type AddToWalletCtaAppearance,
} from "./useAddToWalletCtaViewModel";

export type AddToWalletCtaProps = {
  readonly appearance?: AddToWalletCtaAppearance;
  readonly onPress: () => void;
};

export function AddToWalletCta({ appearance = "gray", onPress }: AddToWalletCtaProps) {
  return <AddToWalletCtaView {...useAddToWalletCtaViewModel({ appearance, onPress })} />;
}
