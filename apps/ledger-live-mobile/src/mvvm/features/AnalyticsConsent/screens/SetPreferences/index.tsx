import React, { memo } from "react";
import { ScrollView } from "react-native";
import {
  Box,
  Card,
  CardContent,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "~/context/Locale";
import Button from "~/components/Button";
import Switch from "~/components/Switch";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { AnalyticsOptInPromptNavigatorParamList } from "~/components/RootNavigator/types/AnalyticsOptInPromptNavigator";
import { ScreenName } from "~/const";
import SafeAreaViewFixed from "~/components/SafeAreaView";
import useSetPreferencesViewModel from "./useSetPreferencesViewModel";
import PrivacyPolicyLink from "../../components/PrivacyPolicyLink";
import { ANALYTICS_CONSENT_PAGE } from "../../const";

interface OptionProps {
  title: string;
  description: string;
  checked: boolean;
  onToggle?: (_: boolean) => void;
}

function Option({ title, description, checked, onToggle }: OptionProps): React.ReactElement {
  return (
    <Box lx={{ width: "full", alignItems: "flex-start" }}>
      <Card lx={{ width: "full" }}>
        <CardHeader lx={{ backgroundColor: "surfaceTransparent" }}>
          <CardLeading>
            <CardContent>
              <CardContentTitle>{title}</CardContentTitle>
            </CardContent>
          </CardLeading>
          <CardTrailing>
            <Switch value={checked} onChange={onToggle} />
          </CardTrailing>
        </CardHeader>
      </Card>
      <Text typography="body3" lx={{ marginTop: "s12", color: "muted" }}>
        {description}
      </Text>
    </Box>
  );
}

type Props = StackNavigatorProps<
  AnalyticsOptInPromptNavigatorParamList,
  ScreenName.AnalyticsOptInPromptDetails
>;

function SetPreferences({ route }: Props) {
  const { t } = useTranslation();
  const { entryPoint } = route.params;

  const {
    flow,
    shouldWeTrack,
    isAnalyticsEnabled,
    setIsAnalyticsEnabled,
    isPersonalRecommendationsEnabled,
    setIsPersonalRecommendationsEnabled,
    handleConfirm,
    onPrivacyPolicyPress,
  } = useSetPreferencesViewModel({ entryPoint });

  return (
    <SafeAreaViewFixed edges={["bottom", "left", "right"]} isFlex>
      <TrackScreen
        category={ANALYTICS_CONSENT_PAGE}
        name="Preferences"
        flow={flow}
        mandatory={shouldWeTrack}
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Box
          lx={{
            paddingHorizontal: "s16",
            flex: 1,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box lx={{ width: "full" }}>
            <Box lx={{ width: "full" }}>
              <Text typography="heading3SemiBold" lx={{ color: "base" }}>
                {t("analyticsConsent.setPreferences.title")}
              </Text>
            </Box>
            <Box lx={{ paddingTop: "s16", width: "full", gap: "s32" }}>
              <Option
                title={t("analyticsConsent.setPreferences.performance")}
                description={t("analyticsConsent.setPreferences.performanceDesc")}
                checked={isAnalyticsEnabled}
                onToggle={setIsAnalyticsEnabled}
              />

              <Option
                title={t("analyticsConsent.setPreferences.experience")}
                description={t("analyticsConsent.setPreferences.experienceDesc")}
                checked={isPersonalRecommendationsEnabled}
                onToggle={setIsPersonalRecommendationsEnabled}
              />
            </Box>
          </Box>
          <Box lx={{ width: "full", gap: "s24" }}>
            <Button
              title={t("common.confirm")}
              onPress={handleConfirm}
              type="main"
              size="large"
              outline={false}
              ml="2"
              flex={1}
            />

            <PrivacyPolicyLink onPrivacyPolicyPress={onPrivacyPolicyPress} />
          </Box>
        </Box>
      </ScrollView>
    </SafeAreaViewFixed>
  );
}

export default memo(SetPreferences);
