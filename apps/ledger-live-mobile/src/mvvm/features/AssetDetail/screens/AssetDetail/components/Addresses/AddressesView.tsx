import React from "react";
import {
  Box,
  Button,
  Pressable,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { PlusCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import { AddressAccountItem } from "./components/AddressAccountItem";
import type { AddressAccountData } from "./useAddressesViewModel";

type Props = Readonly<{
  displayedAccounts: readonly AddressAccountData[];
  hasMore: boolean;
  onAddAccount: () => void;
  onSeeAll: () => void;
}>;

export function AddressesView({ displayedAccounts, hasMore, onAddAccount, onSeeAll }: Props) {
  const { t } = useTranslation();

  if (displayedAccounts.length === 0) return null;

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.addresses}>
      <Subheader>
        <SubheaderRow lx={{ marginBottom: "s12" }}>
          <SubheaderTitle>{t("assetDetail.addresses.title")}</SubheaderTitle>
          <Box lx={{ flex: 1 }} />
          <Pressable
            lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}
            onPress={onAddAccount}
            testID={ASSET_DETAIL_TEST_IDS.addAccount}
          >
            <PlusCircleFill size={20} color="interactive" />
            <Text typography="body2SemiBold" lx={{ color: "active" }}>
              {t("assetDetail.addresses.addAccount")}
            </Text>
          </Pressable>
        </SubheaderRow>
      </Subheader>
      <Box lx={{ gap: "s8" }}>
        {displayedAccounts.map(data => (
          <AddressAccountItem key={data.id} data={data} />
        ))}
      </Box>
      {hasMore && (
        <Button
          appearance="gray"
          size="lg"
          isFull
          onPress={onSeeAll}
          testID={ASSET_DETAIL_TEST_IDS.seeAllAddresses}
          lx={{ marginTop: "s12" }}
        >
          {t("assetDetail.addresses.seeAll")}
        </Button>
      )}
    </Box>
  );
}
