import React from "react";
import {
  Box,
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
  accounts: readonly AddressAccountData[];
  onAddAccount: () => void;
}>;

export function AddressesView({ accounts, onAddAccount }: Props) {
  const { t } = useTranslation();

  if (accounts.length === 0) return null;

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
        {accounts.map(data => (
          <AddressAccountItem key={data.id} data={data} />
        ))}
      </Box>
    </Box>
  );
}
