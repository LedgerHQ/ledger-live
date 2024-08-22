import React from "react";
import { Trans } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import Button from "~/components/Button";
import CircleCurrencyIcon from "~/components/CircleCurrencyIcon";
import { useSelectAccount } from "~/components/Web3AppWebview/helpers";
import { useMaybeAccountName } from "~/reducers/wallet";

type SelectAccountButtonProps = {
  manifest: AppManifest;
  currentAccountHistDb: CurrentAccountHistDB;
};

export default function SelectAccountButton({
  manifest,
  currentAccountHistDb,
}: SelectAccountButtonProps) {
  const { onSelectAccount, currentAccount } = useSelectAccount({ manifest, currentAccountHistDb });

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
      onPress={onSelectAccount}
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
