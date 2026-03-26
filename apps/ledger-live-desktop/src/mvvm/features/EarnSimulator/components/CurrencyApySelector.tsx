import React from "react";
import { ChevronDown } from "@ledgerhq/lumen-ui-react/symbols";

type Props = {
  currencyName: string;
  apy: number;
  onPress: () => void;
};

// TODO: Always opens the modular asset drawer
export default function CurrencyApySelector({ currencyName, apy, onPress }: Props) {
  return (
    <button
      onClick={onPress}
      className="mx-auto flex items-center gap-8 rounded-full bg-muted px-16 py-8"
    >
      <div className="h-20 w-20 rounded-full bg-subtle" />
      <span className="body-3-semi-bold text-base">
        {currencyName} · {apy} APY
      </span>
      <ChevronDown size={16} className="text-muted" />
    </button>
  );
}
