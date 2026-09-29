import React from "react";
import { Box, Link, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { CardAssetsBody } from "./CardAssetsBody.native";
import { CardAssetsInfoTooltip } from "./CardAssetsInfoTooltip.native";
import type { CardAssetsViewModel } from "./types";

export function CardAssetsView({
  isVisible,
  status,
  rows,
  onAssetPress,
  onManagePress,
  onRetryPress,
  onAddAssetPress,
}: CardAssetsViewModel) {
  const { t } = useTranslation();
  const title = t("payTab.card.assets.title");
  const infoLabel = t("payTab.card.assets.info");
  const manageLabel = t("payTab.card.assets.manage");

  if (!isVisible) return null;

  return (
    <Box lx={{ gap: "s12" }} testID="card-assets">
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{title}</SubheaderTitle>
          <CardAssetsInfoTooltip title={title} description={infoLabel} />
          {status === "ready" ? (
            <Box lx={{ flex: 1, alignItems: "flex-end" }}>
              <Link
                appearance="accent"
                size="sm"
                underline={false}
                onPress={onManagePress}
                testID="card-assets-manage"
              >
                {manageLabel}
              </Link>
            </Box>
          ) : null}
        </SubheaderRow>
      </Subheader>

      <CardAssetsBody
        status={status}
        rows={rows}
        onAssetPress={onAssetPress}
        onRetryPress={onRetryPress}
        onAddAssetPress={onAddAssetPress}
      />
    </Box>
  );
}
