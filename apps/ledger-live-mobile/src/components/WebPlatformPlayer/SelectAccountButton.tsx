import React from "react";
import { Trans } from "react-i18next";
import { Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { CurrentAccountHistDB } from "@ledgerhq/live-common/wallet-api/react";
import Button from "~/components/Button";
import CircleCurrencyIcon from "~/components/CircleCurrencyIcon";
import { useMaybeAccountName } from "~/reducers/wallet";
import { useSelectAccount } from "../Web3AppWebview/helpers";
import {
  ModularDrawerLocation,
  useModularDrawerVisibility,
  useModularDrawerController,
} from "LLM/features/ModularDrawer";
import { currentRouteNameRef } from "~/analytics/screenRefs";

type SelectAccountButtonProps = {
  manifest: AppManifest;
  currentAccountHistDb: CurrentAccountHistDB;
};

export default function SelectAccountButton({
  manifest,
  currentAccountHistDb,
}: SelectAccountButtonProps) {
  const { onSelectAccount, currentAccount, currencyIds, onSelectAccountSuccess } = useSelectAccount(
    {
      manifest,
      currentAccountHistDb,
    },
  );

  const currentAccountName = useMaybeAccountName(currentAccount);

  const { isModularDrawerVisible } = useModularDrawerVisibility({
    modularDrawerFeatureFlagKey: "llmModularDrawer",
  });

  const canOpenModularDrawer = isModularDrawerVisible({
    location: ModularDrawerLocation.LIVE_APP,
    liveAppId: manifest.id,
  });

  const { openDrawer } = useModularDrawerController();

  const handleAddAccountPress = () => {
    if (canOpenModularDrawer) {
      openDrawer({
        currencies: currencyIds,
        areCurrenciesFiltered: true,
        enableAccountSelection: true,
        onAccountSelected: onSelectAccountSuccess,
        flow: manifest.name,
        source:
          currentRouteNameRef.current === "Platform Catalog"
            ? "Discover"
            : currentRouteNameRef.current ?? "Unknown",
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
