import React, { useCallback, useState } from "react";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import { useDappCurrentAccount } from "@ledgerhq/live-common/wallet-api/useDappLogic";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import { useTheme } from "@react-navigation/native";
import Button from "~/components/Button";
import SelectAccountModal from "./SelectAccountModal";

type SelectAccountButtonProps = {
  manifest: AppManifest;
  currentAccountHistDb: CurrentAccountHistDB;
};

export default function SelectAccountButton({
  manifest,
  currentAccountHistDb,
}: SelectAccountButtonProps) {
  const { currentAccount } = useDappCurrentAccount(manifest.id, currentAccountHistDb);
  const { dark } = useTheme();
  const [modalOpened, setModalOpened] = useState(false);

  const onSelectAccount = useCallback(() => {
    setModalOpened(true);
  }, []);

  const onClose = useCallback(() => {
    setModalOpened(false);
  }, []);

  const currency =
    currentAccount?.type === "TokenAccount" ? currentAccount.token : currentAccount?.currency;
  const ledgerId = currency?.id;
  const tickerProp = currency?.ticker;
  const network = currency?.type === "TokenCurrency" ? currency.parentCurrency.id : undefined;
  const iconTheme = dark ? "dark" : "light";

  return (
    <>
      <SelectAccountModal
        manifest={manifest}
        currentAccountHistDb={currentAccountHistDb}
        isOpened={modalOpened}
        onSelectAccount={onSelectAccount}
        onClose={onClose}
      />
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
        onPress={onSelectAccount}
        accessibilityLabel="Select Account"
        isNewIcon
      />
    </>
  );
}
