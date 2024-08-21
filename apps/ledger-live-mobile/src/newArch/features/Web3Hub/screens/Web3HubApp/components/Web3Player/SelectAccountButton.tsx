import React from "react";
import { Trans } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import { useDappCurrentAccount } from "@ledgerhq/live-common/wallet-api/useDappLogic";
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
  const { currentAccount } = useDappCurrentAccount(currentAccountHistDb);

  const { onSelectAccount } = useSelectAccount({ manifest, currentAccountHistDb });

  const currentAccountName = useMaybeAccountName(currentAccount);

  return (
    <Button type="primary" onPress={onSelectAccount}>
      {!currentAccount ? (
        <Text>
          <Trans i18nKey="common.selectAccount" />
        </Text>
      ) : (
        <Flex flexDirection="row" height={50} alignItems="center" justifyContent="center">
          <CircleCurrencyIcon
            size={24}
            currency={
              currentAccount.type === "TokenAccount"
                ? currentAccount.token
                : currentAccount.currency
            }
          />
          <Text color={"neutral.c20"} ml={4}>
            {currentAccountName}
          </Text>
        </Flex>
      )}
    </Button>
  );
}
