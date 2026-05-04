import React, { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, Button, Switch, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  analyticsEnabledSelector,
  personalizedRecommendationsEnabledSelector,
} from "~/reducers/settings";
import { setAnalytics, setAnalyticsConsentInfo, setHasSeenAnalyticsOptInPrompt, setPersonalizedRecommendations } from "~/actions/settings";
import { ScreenName } from "~/const";
import { TrackScreen, track, updateIdentify } from "~/analytics";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { resolveAnalyticsOptInParams } from "@ledgerhq/live-common/analyticsConsent/index";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";
import { ConsentFooter } from "LLM/features/AnalyticsConsentDrawer/components/ConsentFooter";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { SettingsNavigatorStackParamList } from "~/components/RootNavigator/types/SettingsNavigator";

type Props = StackNavigatorProps<SettingsNavigatorStackParamList, ScreenName.AnalyticsPreferencesSettings>;

export default function AnalyticsPreferencesSettings({ navigation, route }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const privacyPolicyUrl = useLocalizedUrl(urls.privacyPolicy.en);
  const footerBottomPadding = bottomInset + 16;
  const analyticsOptInFeature = useFeature("analyticsOptIn");
  const { policyVersion } = resolveAnalyticsOptInParams(analyticsOptInFeature);

  const initialTogglesOff = route.params?.initialTogglesOff === true;
  const analyticsFromStore = useSelector(analyticsEnabledSelector);
  const personalizedFromStore = useSelector(personalizedRecommendationsEnabledSelector);

  const [appPerformanceEnabled, setAppPerformanceEnabled] = useState(
    initialTogglesOff ? false : analyticsFromStore,
  );
  const [personalizedEnabled, setPersonalizedEnabled] = useState(
    initialTogglesOff ? false : personalizedFromStore,
  );

  const onConfirm = useCallback(async () => {
    const wasFullyOptedOut = !analyticsFromStore && !personalizedFromStore;
    const willBeFullyOptedOut = !appPerformanceEnabled && !personalizedEnabled;
    // Same idea as analytics consent `applyOptOut`: do not force tracking when the user was already
    // fully opted out in the store and confirms without enabling either toggle.
    const mandatory = !(wasFullyOptedOut && willBeFullyOptedOut);

    await track(
      "button_clicked",
      {
        button: "analytics_preferences_confirm",
        page: "Analytics preferences settings",
        appPerformance: appPerformanceEnabled,
        personalizedExperience: personalizedEnabled,
      },
      mandatory,
    );
    dispatch(setAnalytics(appPerformanceEnabled));
    dispatch(setPersonalizedRecommendations(personalizedEnabled));
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: new Date().toISOString(),
        privacyPolicyVersion: policyVersion,
      }),
    );
    dispatch(setHasSeenAnalyticsOptInPrompt(true));
    await updateIdentify(undefined, mandatory);
    navigation.goBack();
  }, [
    analyticsFromStore,
    appPerformanceEnabled,
    dispatch,
    navigation,
    personalizedEnabled,
    personalizedFromStore,
    policyVersion,
  ]);

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }}>
      <TrackScreen category="Analytics preferences settings" name="Set preferences" />
      <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s12" }}>
        <Text
          typography="heading3SemiBold"
          lx={{ color: "base" }}
          testID="analytics-preferences-screen-title"
        >
          {t("analyticsPreferencesSettings.screenTitle")}
        </Text>
      </Box>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Box lx={{ gap: "s32", paddingVertical: "s16" }}>
          <PreferenceSection
            title={t("analyticsPreferencesSettings.appPerformance.title")}
            description={t("analyticsPreferencesSettings.appPerformance.description")}
            value={appPerformanceEnabled}
            onValueChange={setAppPerformanceEnabled}
            testID="analytics-preferences-app-performance-switch"
          />
          <PreferenceSection
            title={t("analyticsPreferencesSettings.personalizedExperience.title")}
            description={t("analyticsPreferencesSettings.personalizedExperience.description")}
            value={personalizedEnabled}
            onValueChange={setPersonalizedEnabled}
            testID="analytics-preferences-personalized-switch"
          />
        </Box>
      </ScrollView>

      <Box
        lx={{
          paddingHorizontal: "s16",
          paddingTop: "s16",
          gap: "s16",
        }}
        style={{ paddingBottom: footerBottomPadding }}
      >
        <Button appearance="base" size="lg" onPress={onConfirm}>
          {t("analyticsPreferencesSettings.confirmCta")}
        </Button>
        <ConsentFooter privacyPolicyUrl={privacyPolicyUrl} />
      </Box>
    </Box>
  );
}

type PreferenceSectionProps = Readonly<{
  title: string;
  description: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  testID: string;
}>;

function PreferenceSection({
  title,
  description,
  value,
  onValueChange,
  testID,
}: PreferenceSectionProps) {
  return (
    <Box>
      <Box
        lx={{
          width: "full",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: "s12",
          paddingVertical: "s20",
          backgroundColor: "surface",
          borderRadius: "md",
          marginBottom: "s12",
        }}
      >
        <Text typography="body2" lx={{ color: "base", flex: 1, flexShrink: 1 }}>
          {title}
        </Text>
        <Switch
          checked={value}
          onCheckedChange={onValueChange}
          accessibilityLabel={title}
          testID={testID}
        />
      </Box>
      <Text typography="body3" lx={{ color: "muted" }}>
        {description}
      </Text>
    </Box>
  );
}
