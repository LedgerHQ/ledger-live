import React, { useMemo } from "react";
import { View } from "react-native";
import { useTranslation } from "~/context/Locale";
import {
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  ListItem,
  ListItemLeading,
  ListItemSpot,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  ListItemTrailing,
  ListItemIcon,
} from "@ledgerhq/lumen-ui-rnative";
import { Wallet, LedgerLogo, CheckmarkCircle } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { formatAddress } from "LLM/features/Accounts/utils/formatAddress";
import type { AddressSearchResult } from "../types";

type AddressMatchedSectionProps = Readonly<{
  searchResult: AddressSearchResult;
  searchValue: string;
  onSelect: (address: string, ensName?: string) => void;
  isSanctioned: boolean;
  isAddressComplete: boolean;
  hasBridgeError: boolean;
}>;

export function AddressMatchedSection({
  searchResult,
  searchValue,
  onSelect,
  isSanctioned,
  isAddressComplete,
  hasBridgeError,
}: AddressMatchedSectionProps) {
  const { t } = useTranslation();
  const styles = useStyleSheet(
    theme => ({
      container: {
        gap: theme.spacings.s12,
      },
      header: {
        paddingHorizontal: theme.spacings.s8,
      },
    }),
    [],
  );

  const resolvedAddress = searchResult.resolvedAddress ?? searchValue;
  const isLedgerAccount = searchResult.isLedgerAccount;
  const Icon = isLedgerAccount ? LedgerLogo : Wallet;

  const displayName = useMemo(
    () => searchResult.ensName ?? formatAddress(resolvedAddress),
    [searchResult.ensName, resolvedAddress],
  );

  const description = useMemo(() => {
    if (searchResult.ensName) {
      return formatAddress(resolvedAddress);
    }
    return undefined;
  }, [searchResult.ensName, resolvedAddress]);

  const handleSelect = () => {
    onSelect(resolvedAddress, searchResult.ensName);
  };

  if (isSanctioned) {
    return null;
  }

  const isDisabled = hasBridgeError;

  return (
    <View style={styles.container}>
      <Subheader style={styles.header}>
        <SubheaderRow>
          <SubheaderTitle>{t("newSendFlow.addressMatched")}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <ListItem onPress={handleSelect} disabled={isDisabled}>
        <ListItemLeading>
          <ListItemSpot appearance="icon" icon={Icon} />
          <ListItemContent>
            <ListItemTitle>{t("newSendFlow.sendTo", { address: displayName })}</ListItemTitle>
            {description && <ListItemDescription>{description}</ListItemDescription>}
          </ListItemContent>
        </ListItemLeading>
        {isAddressComplete && !hasBridgeError && (
          <ListItemTrailing>
            <ListItemIcon icon={CheckmarkCircle} color="success" />
          </ListItemTrailing>
        )}
      </ListItem>
    </View>
  );
}
