import React, { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import type { AleoStakingPosition } from "@ledgerhq/live-common/families/aleo/react";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { useTranslation } from "~/context/Locale";
import type { FieldType } from "~/components/DelegationDrawer";

/** Validator identity rows shared by both staking drawers. */
export function useValidatorFields(
  account: AleoAccount,
  position: AleoStakingPosition,
): FieldType[] {
  const { t } = useTranslation();
  const { bondedValidator, validatorLabel } = position;
  // validatorLabel falls back to the address, which the address row already shows.
  const name = validatorLabel && validatorLabel !== bondedValidator ? validatorLabel : null;

  const explorerUrl =
    bondedValidator &&
    getAddressExplorer(getDefaultExplorerView(account.currency), bondedValidator);

  const openExplorer = useCallback(() => {
    if (explorerUrl) Linking.openURL(explorerUrl);
  }, [explorerUrl]);

  return useMemo(() => {
    const fields: FieldType[] = [];

    if (name) {
      fields.push({
        label: t("delegation.validator"),
        Component: (
          <Text
            variant="body"
            fontWeight="semiBold"
            numberOfLines={1}
            testID="aleo-manage-validator"
          >
            {name}
          </Text>
        ),
      });
    }

    if (bondedValidator) {
      fields.push({
        label: t("delegation.validatorAddress"),
        Component: (
          <Text
            variant="body"
            fontWeight="semiBold"
            numberOfLines={1}
            color={explorerUrl ? "primary.c80" : "neutral.c100"}
            onPress={explorerUrl ? openExplorer : undefined}
            testID="aleo-manage-validator-address"
          >
            {shortAddressPreview(bondedValidator)}
          </Text>
        ),
      });
    }

    return fields;
  }, [t, name, bondedValidator, explorerUrl, openExplorer]);
}
