import React from "react";
import { ScrollView } from "react-native";
import {
  AmountInput,
  Banner,
  Box,
  Button,
  Divider,
  InteractiveIcon,
  Switch,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { IconBox, IconsLegacy } from "@ledgerhq/native-ui";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import { TrackScreen } from "@shared/analytics-react";
import Alert from "~/components/Alert";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import SafeAreaView from "~/components/SafeAreaView";
import { Trans, useTranslation } from "~/context/Locale";
import InfoModal from "~/modals/Info";
import { type Props, useSettingsViewModel } from "./useSettingsViewModel";

function InfoIcon() {
  return <IconBox Icon={IconsLegacy.InfoMedium} color="primary.c80" boxSize={64} iconSize={24} />;
}

function SwitchRow({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Box lx={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      {children}
    </Box>
  );
}

export default function Settings(props: Props) {
  const { t } = useTranslation();
  const viewModel = useSettingsViewModel(props);

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen category="XrpAddTokenFlow" name="Settings" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Alert type="primary" testID="xrp-limit-info-banner">
          {t("xrp.addToken.steps.settings.limitInfo", { token: viewModel.token.ticker })}
        </Alert>
        <Box lx={{ alignItems: "center", gap: "s8", paddingTop: "s8" }}>
          <Text typography="body2" lx={{ color: "muted" }}>
            {t("xrp.tokenSettings.limit")}
          </Text>
          <AmountInput
            value={viewModel.limitText}
            onChangeText={viewModel.onChangeLimitText}
            currencyText={viewModel.token.ticker}
            currencyPosition="right"
            maxIntegerLength={16}
            disabled={viewModel.isMaximum}
            isInvalid={viewModel.isLimitErrorVisible}
            testID="xrp-limit-input"
          />
          {viewModel.isLimitErrorVisible ? (
            <Text typography="body3" lx={{ color: "error" }}>
              {t("xrp.addToken.errors.limitZero")}
            </Text>
          ) : null}
        </Box>
        <Box lx={{ flex: 1 }} />
        <Box lx={{ gap: "s12" }}>
          <Divider />
          <SwitchRow>
            <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}>
              <Text typography="body2" lx={{ color: "base" }}>
                {t("xrp.tokenSettings.maxLimit")}
              </Text>
              <InteractiveIcon
                icon={Information}
                size={16}
                iconType="stroked"
                accessibilityLabel={t("xrp.tokenSettings.maxLimit")}
                onPress={viewModel.onOpenMaxLimitInfo}
                testID="xrp-max-limit-info"
              />
            </Box>
            <Switch
              checked={viewModel.isMaximum}
              onCheckedChange={viewModel.onChangeUseMax}
              accessibilityLabel={t("xrp.tokenSettings.maxLimit")}
              testID="xrp-limit-max-switch"
            />
          </SwitchRow>
          <SwitchRow>
            <Text typography="body2" lx={{ color: "base" }}>
              {t("xrp.rippling.label")}
            </Text>
            <Switch
              checked={viewModel.isRippling}
              onCheckedChange={viewModel.onChangeRippling}
              accessibilityLabel={t("xrp.rippling.label")}
              testID="xrp-rippling-switch"
            />
          </SwitchRow>
          {viewModel.isRippling ? (
            <Banner
              appearance="warning"
              title={t("xrp.rippling.warning")}
              testID="xrp-rippling-warning"
            />
          ) : null}
        </Box>
      </ScrollView>
      <InfoModal
        isOpened={viewModel.isMaxLimitInfoOpen}
        onClose={viewModel.onCloseMaxLimitInfo}
        data={[
          {
            Icon: InfoIcon,
            title: t("xrp.tokenSettings.maxLimit"),
            description: (
              <Trans
                i18nKey="xrp.tokenSettings.maxLimitInfo"
                values={{ token: viewModel.token.ticker }}
                components={{
                  amount: (
                    <CurrencyUnitValue
                      unit={viewModel.token.units[0]}
                      value={viewModel.maxLimit}
                      showCode
                    />
                  ),
                }}
              />
            ),
          },
        ]}
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
