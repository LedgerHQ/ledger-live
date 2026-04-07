import React from "react";
import { Trans } from "~/context/Locale";
import { Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { SetCurrentAccountHistDb } from "@ledgerhq/live-common/wallet-api/react";
import Button from "~/components/Button";
import CircleCurrencyIcon from "~/components/CircleCurrencyIcon";
import { useMaybeAccountName } from "~/reducers/wallet";
import { useSelectAccount } from "../Web3AppWebview/helpers";

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

  const currentAccountName = useMaybeAccountName(currentAccount);

  return (
    <Button
      Icon={
        !currentAccount ? undefined : (
          <CircleCurrencyIcon
            size={24}
            currency={
              currentAccount.type === "TokenAccount"
                ? currentAccount.token
                : currentAccount.currency
            }
          />
        )
      }
      iconPosition={"left"}
      type="primary"
      onPress={handleAddAccountPress}
      isNewIcon
    >
      {!currentAccount ? (
        <Text>
          <Trans i18nKey="common.selectAccount" />
        </Text>
      ) : (
        <Text color={"neutral.c20"}>{currentAccountName}</Text>
      )}
    </Button>
  );
}
