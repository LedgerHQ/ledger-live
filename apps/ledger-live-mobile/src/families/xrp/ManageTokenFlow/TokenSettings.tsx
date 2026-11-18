import React from "react";
import { ScrollView } from "react-native";
import {
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import { TrackScreen } from "@shared/analytics-react";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { ErrorBanner } from "../components/ErrorBanner";
import { FullTextBanner } from "../components/FullTextBanner";
import { InfoTooltip } from "../components/InfoTooltip";
import { RipplingSheet } from "./RipplingSheet";
import { type Props, useTokenSettingsViewModel } from "./useTokenSettingsViewModel";

function ValueTrailing({ value, testID }: Readonly<{ value: string; testID: string }>) {
  return (
    <ListItemTrailing lx={{ flexDirection: "row", alignItems: "center", gap: "s8" }}>
      <Text typography="body2SemiBold" lx={{ color: "base" }} testID={testID}>
        {value}
      </Text>
      <ChevronRight size={16} color="muted" />
    </ListItemTrailing>
  );
}

export default function TokenSettings(props: Props) {
  const { t } = useTranslation();
  const viewModel = useTokenSettingsViewModel(props);
  const ripplingLabel = t("xrp.rippling.label");

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="XrpManageTokenFlow" name="TokenSettings" />
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 16 }}>
        <Text typography="heading3SemiBold" lx={{ color: "base" }}>
          {t("xrp.tokenSettings.editTitle")}
        </Text>
        {viewModel.isCurrentLimitZero ? (
          <FullTextBanner
            appearance="warning"
            title={t("xrp.tokenSettings.currentLimitZero")}
            testID="xrp-current-limit-zero-warning"
          />
        ) : null}
        <Box>
          <ListItem onPress={viewModel.onEditLimit} testID="xrp-settings-limit-row">
            <ListItemLeading>
              <ListItemContent>
                <ListItemTitle lx={{ color: "muted" }}>
                  {t("xrp.tokenSettings.balanceLimit")}
                </ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
            <ValueTrailing value={viewModel.limitText} testID="xrp-settings-limit-value" />
          </ListItem>
          <ListItem onPress={viewModel.onOpenRipplingSheet} testID="xrp-settings-rippling-row">
            <ListItemLeading>
              <ListItemContent>
                <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
                  <ListItemTitle lx={{ color: "muted" }}>{ripplingLabel}</ListItemTitle>
                  <InfoTooltip title={ripplingLabel} info={t("xrp.manageAssets.ripplingInfo")} />
                </Box>
              </ListItemContent>
            </ListItemLeading>
            <ValueTrailing value={viewModel.ripplingText} testID="xrp-settings-rippling-value" />
          </ListItem>
        </Box>
        {viewModel.isRippling ? (
          <FullTextBanner
            appearance="warning"
            description={t("xrp.rippling.warning")}
            testID="xrp-rippling-warning"
          />
        ) : null}
        {viewModel.errors.map(error => (
          <ErrorBanner key={error.name} error={error} />
        ))}
      </ScrollView>
      <RipplingSheet
        isOpen={viewModel.isRipplingSheetOpen}
        isRippling={viewModel.isRippling}
        onSelect={viewModel.onChangeRippling}
        onClose={viewModel.onCloseRipplingSheet}
      />
      <Box lx={{ padding: "s16" }}>
        <Button
          appearance="base"
          size="lg"
          isFull
          disabled={viewModel.isContinueDisabled}
          loading={viewModel.isContinueLoading}
          onPress={viewModel.onContinue}
          testID="xrp-settings-continue"
        >
          {t("common.continue")}
        </Button>
      </Box>
    </SafeAreaView>
  );
}
