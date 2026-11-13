import React from "react";
import { ScrollView } from "react-native";
import {
  Box,
  Button,
  InteractiveIcon,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight, Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import { TrackScreen } from "@shared/analytics-react";
import SafeAreaView from "~/components/SafeAreaView";
import { useTranslation } from "~/context/Locale";
import { ErrorBanner } from "../components/ErrorBanner";
import { FullTextBanner } from "../components/FullTextBanner";
import { RipplingInfoModal } from "../components/TrustLimitSettings";
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
                <ListItemTitle>{t("xrp.tokenSettings.balanceLimit")}</ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
            <ValueTrailing value={viewModel.limitText} testID="xrp-settings-limit-value" />
          </ListItem>
          <ListItem onPress={viewModel.onOpenRipplingSheet} testID="xrp-settings-rippling-row">
            <ListItemLeading>
              <ListItemContent>
                <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
                  <ListItemTitle>{ripplingLabel}</ListItemTitle>
                  <InteractiveIcon
                    icon={Information}
                    size={16}
                    iconType="stroked"
                    accessibilityLabel={ripplingLabel}
                    onPress={viewModel.onOpenRipplingInfo}
                    testID="xrp-rippling-info"
                  />
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
        {viewModel.bridgeError ? <ErrorBanner error={viewModel.bridgeError} /> : null}
        {viewModel.isLimitBelowBalance ? (
          <FullTextBanner
            appearance="warning"
            description={t("xrp.tokenSettings.limitBelowBalance", {
              balance: viewModel.balanceText,
            })}
            testID="xrp-limit-below-balance-warning"
          />
        ) : null}
      </ScrollView>
      <RipplingSheet
        isOpen={viewModel.isRipplingSheetOpen}
        isRippling={viewModel.isRippling}
        onSelect={viewModel.onChangeRippling}
        onClose={viewModel.onCloseRipplingSheet}
      />
      <RipplingInfoModal
        isOpened={viewModel.isRipplingInfoOpen}
        onClose={viewModel.onCloseRipplingInfo}
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
