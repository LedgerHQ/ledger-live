import React from "react";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import { useTheme } from "@react-navigation/native";
import Button from "~/components/Button";
import { useSelectAccount } from "~/components/Web3AppWebview/helpers";

type SelectAccountButtonProps = {
  manifest: AppManifest;
  currentAccountHistDb: CurrentAccountHistDB;
};

export default function SelectAccountButton({
  manifest,
  currentAccountHistDb,
}: SelectAccountButtonProps) {
  const { handleAddAccountPress, currentAccount } = useSelectAccount({
    manifest,
    currentAccountHistDb,
  });
  const { dark } = useTheme();

  const currency =
    currentAccount?.type === "TokenAccount" ? currentAccount.token : currentAccount?.currency;
  const ledgerId = currency?.id;
  const tickerProp = currency?.ticker;
  const network = currency?.type === "TokenCurrency" ? currency.parentCurrency.id : undefined;
  const iconTheme = dark ? "dark" : "light";

  return (
    <Button
      Icon={
        !currentAccount ? undefined : (
          <CryptoIcon
            ledgerId={ledgerId}
            ticker={tickerProp}
            size={32}
            theme={iconTheme}
            backgroundColor="dark"
            overridesRadius={12}
            {...(network && { network })}
          />
        )
      }
      onPress={handleAddAccountPress}
      accessibilityLabel="Select Account"
      isNewIcon
    />
  );
}
