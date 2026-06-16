import React from "react";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { SetCurrentAccountHistDb } from "@ledgerhq/live-common/wallet-api/react";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import Button from "~/components/Button";
import { useSelectAccount } from "~/components/Web3AppWebview/helpers";

type SelectAccountButtonProps = {
  manifest: AppManifest;
  setCurrentAccountHistDb: SetCurrentAccountHistDb;
};

export default function SelectAccountButton({
  manifest,
  setCurrentAccountHistDb,
}: SelectAccountButtonProps) {
  const { handleAddAccountPress, currentAccount } = useSelectAccount({
    manifest,
    setCurrentAccountHistDb,
  });
  const currency =
    currentAccount?.type === "TokenAccount" ? currentAccount.token : currentAccount?.currency;
  const ledgerId = currency?.id;
  const tickerProp = currency?.ticker;
  const network = currency?.type === "TokenCurrency" ? currency.parentCurrencyId : undefined;

  const canRenderIcon = !!currentAccount && !!ledgerId && !!tickerProp;

  return (
    <Button
      Icon={
        canRenderIcon ? (
          <CryptoIcon
            ledgerId={ledgerId}
            ticker={tickerProp}
            size={32}
            shape="square"
            {...(network && { network })}
          />
        ) : undefined
      }
      onPress={handleAddAccountPress}
      accessibilityLabel="Select Account"
      isNewIcon
    />
  );
}
