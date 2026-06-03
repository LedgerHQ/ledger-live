import React from "react";
import { StyleSheet } from "react-native";
import { Box, Button, IconButton, Link, Text } from "@ledgerhq/lumen-ui-rnative";
import { Lottie } from "LLM/components/Lottie";
import { useAnalyticsConsentViewModel } from "./useAnalyticsConsentViewModel";
import { ArrowLeft, SettingsAlt2 } from "@ledgerhq/lumen-ui-rnative/symbols";
import { TrackScreen } from "~/analytics";
import SafeAreaView from "~/components/SafeAreaView";
import PrivacyPolicyLink from "../../components/PrivacyPolicyLink";
import { ANALYTICS_CONSENT_PAGE } from "../../const";

const AnalyticsConsent = () => {
  const {
    title,
    subTitle,
    setPreferencesCTA,
    refuseCTA,
    acceptCTA,
    backLabel,
    animationSource,
    shouldShowBackButton,
    onBackPress,
    onSetPreferencesPress,
    onRefusePress,
    onAcceptPress,
    onPrivacyPolicyPress,
    flow,
    shouldWeTrack,
  } = useAnalyticsConsentViewModel();

  return (
    <Box
      lx={{
        flex: 1,
        backgroundColor: "canvas",
      }}
    >
      <SafeAreaView isFlex>
        <TrackScreen category={ANALYTICS_CONSENT_PAGE} flow={flow} mandatory={shouldWeTrack} />
        <Box lx={{ flex: 1, paddingBottom: "s24" }}>
          <Box lx={{ alignItems: "flex-start", paddingHorizontal: "s4", paddingTop: "s8" }}>
            {shouldShowBackButton ? (
              <IconButton
                icon={ArrowLeft}
                appearance="no-background"
                size="md"
                onPress={onBackPress}
                accessibilityLabel={backLabel}
              />
            ) : null}
          </Box>

          <Box
            lx={{
              paddingHorizontal: "s16",
              paddingBottom: "s24",
            }}
          >
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              {title}
            </Text>
            <Text typography="body2" lx={{ color: "muted", marginTop: "s8" }}>
              {subTitle}
            </Text>
          </Box>
          <Box lx={{ flex: 1 }}>
            <Lottie
              autoPlay
              loop={false}
              source={animationSource}
              style={StyleSheet.absoluteFillObject}
            />

            <Box style={{ marginTop: "auto" }} lx={{ paddingHorizontal: "s16", gap: "s32" }}>
              <Box lx={{ flexDirection: "row", gap: "s12" }}>
                <Box lx={{ flex: 1 }}>
                  <Button appearance="gray" size="lg" isFull onPress={onRefusePress}>
                    {refuseCTA}
                  </Button>
                </Box>
                <Box lx={{ flex: 1 }}>
                  <Button appearance="base" size="lg" isFull onPress={onAcceptPress}>
                    {acceptCTA}
                  </Button>
                </Box>
              </Box>

              <Box lx={{ alignItems: "center", justifyContent: "center", gap: "s16" }}>
                <Link
                  icon={SettingsAlt2}
                  appearance="accent"
                  size="md"
                  underline={false}
                  onPress={onSetPreferencesPress}
                >
                  {setPreferencesCTA}
                </Link>
                <PrivacyPolicyLink onPrivacyPolicyPress={onPrivacyPolicyPress} />
              </Box>
            </Box>
          </Box>
        </Box>
      </SafeAreaView>
    </Box>
  );
};

export default AnalyticsConsent;
