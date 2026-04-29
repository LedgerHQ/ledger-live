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
import type { Account } from "@ledgerhq/types-live";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import { AddressAccountItem } from "./components/AddressAccountItem";
import type { AddressAccountData } from "./useAddressesViewModel";

type Props = Readonly<{
  accounts: readonly AddressAccountData[];
  onAccountPress: (account: Account) => void;
  onAddAccount: () => void;
}>;

export function AddressesView({ accounts, onAccountPress, onAddAccount }: Props) {
  const { t } = useTranslation();

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
      <Box lx={{ backgroundColor: "surface", borderRadius: "md", paddingVertical: "s4" }}>
        {accounts.length > 0 ? (
          accounts.map(data => (
            <AddressAccountItem key={data.id} data={data} onPress={onAccountPress} />
          ))
        ) : (
          <Box lx={{ padding: "s16", alignItems: "center" }}>
            <Text typography="body3" lx={{ color: "muted" }}>
              {t("assetDetail.addresses.empty")}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
