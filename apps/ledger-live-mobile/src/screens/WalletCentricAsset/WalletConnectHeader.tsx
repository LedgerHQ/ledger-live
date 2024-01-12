import React from "react";
import { WalletConnectMedium } from "@ledgerhq/native-ui/assets/icons";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import Touchable from "~/components/Touchable";
import { useWalletConnectAction } from "./hooks/useWalletConnectAction";

type Props = {
  currency: CryptoOrTokenCurrency;
  event: string;
};

export function WalletConnectAction({ currency, event }: Props) {
  const { onWalletConnectPress, isWalletConnectActionDisplayable } = useWalletConnectAction({
    currency,
    event,
  });

  if (!isWalletConnectActionDisplayable) {
    return null;
  }
  return (
    <Touchable onPress={onWalletConnectPress}>
      <WalletConnectMedium size={24} color={"neutral.c100"} />
    </Touchable>
  );
}
