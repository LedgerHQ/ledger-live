import React, { useCallback, useMemo } from "react";
import { Linking, StyleSheet } from "react-native";
import { Text } from "@ledgerhq/native-ui";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import type { AleoStakingPositionView } from "@ledgerhq/live-common/families/aleo/react";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { useTranslation } from "~/context/Locale";
import Skeleton from "~/components/Skeleton";
import type { FieldType } from "~/components/DelegationDrawer";

export function useValidatorFields(
  account: AleoAccount,
  position: AleoStakingPositionView,
): FieldType[] {
  const { t } = useTranslation();
  const { bondedValidator, validatorLabel, validatorsLoading } = position;
  const labelIsAddressFallback = !validatorLabel || validatorLabel === bondedValidator;
  const name = labelIsAddressFallback ? null : validatorLabel;

  const explorerUrl =
    bondedValidator &&
    getAddressExplorer(getDefaultExplorerView(account.currency), bondedValidator);

  const openExplorer = useCallback(() => {
    if (explorerUrl) Linking.openURL(explorerUrl);
  }, [explorerUrl]);

  return useMemo(() => {
    const fields: FieldType[] = [];

    if (validatorsLoading) {
      fields.push({
        label: t("delegation.validator"),
        Component: <Skeleton loading style={styles.nameSkeleton} />,
      });
    } else if (name) {
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
  }, [t, name, bondedValidator, explorerUrl, openExplorer, validatorsLoading]);
}

const styles = StyleSheet.create({
  nameSkeleton: {
    width: 120,
    height: 16,
    borderRadius: 4,
  },
});
