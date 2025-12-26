import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import React, { ComponentType } from "react";
import GenericMemoInput from "./GenericMemoInput";
import StellarMemoInput from "./StellarMemoInput";

type MemoInputFactoryProps = {
  currency: CryptoCurrency | TokenCurrency;
  onChange: (value: string, type?: string) => void;
};

const componentByCurrency: Record<string, ComponentType<MemoInputFactoryProps>> = {
  stellar: StellarMemoInput,
};

export default function MemoInputFactory({ currency, onChange }: MemoInputFactoryProps) {
  const memoType = sendFeatures.getMemoType(currency);
  const CustomComponent = componentByCurrency[currency.id];

  return memoType == "typed" && CustomComponent ? (
    <CustomComponent currency={currency} onChange={onChange} />
  ) : (
    <GenericMemoInput currency={currency} onChange={onChange} />
  );
}
