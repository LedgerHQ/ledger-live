import React from "react";
import { Trans } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import Button from "~/components/Button";
import CircleCurrencyIcon from "~/components/CircleCurrencyIcon";
import { useMaybeAccountName } from "~/reducers/wallet";
import { useSelectAccount } from "../Web3AppWebview/helpers";
import { OpenModularDrawerFunction } from "LLM/features/ModularDrawer/types";

type SelectAccountButtonProps = {
  manifest: AppManifest;
  currentAccountHistDb: CurrentAccountHistDB;
  openModularDrawer?: OpenModularDrawerFunction;
};

export default function SelectAccountButton({
  manifest,
  currentAccountHistDb,
  openModularDrawer,
}: SelectAccountButtonProps) {
  const { onSelectAccount, currentAccount, currencies, onSelectAccountSuccess } = useSelectAccount({
    manifest,
    currentAccountHistDb,
  });

  const currentAccountName = useMaybeAccountName(currentAccount);

  const handleAddAccountPress = () => {
    if (openModularDrawer) {
      openModularDrawer({
        currencies,
        enableAccountSelection: false,
        onAccountSelected: onSelectAccountSuccess,
      });
    } else {
      onSelectAccount();
    }
  };

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
