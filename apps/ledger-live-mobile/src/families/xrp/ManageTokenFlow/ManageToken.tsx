import React from "react";
import { ScrollView } from "react-native";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "@shared/analytics-react";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { AssetCard } from "./AssetCard";
import { type Props, useManageTokenViewModel } from "./useManageTokenViewModel";

export default function ManageToken(props: Props) {
  const { t } = useTranslation();
  const { assets, onEdit } = useManageTokenViewModel(props);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="XrpManageTokenFlow" name="ManageToken" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {assets.length === 0 ? (
          <Text typography="body2" lx={{ color: "muted" }} testID="xrp-manage-assets-empty">
            {t("xrp.manageToken.empty")}
          </Text>
        ) : null}
        {assets.map(asset => (
          <AssetCard key={asset.id} {...asset} onEdit={onEdit} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
