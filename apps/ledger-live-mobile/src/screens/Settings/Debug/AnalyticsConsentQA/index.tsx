import React, { useMemo } from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  needsConsentRenewal,
  needsPrivacyPolicyAck,
  resolveAnalyticsConsentPhase,
  resolveAnalyticsOptInParams,
} from "@ledgerhq/live-common/analyticsConsent/index";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  analyticsConsentInfoSelector,
  analyticsEnabledSelector,
  hasCompletedOnboardingSelector,
  personalizedRecommendationsEnabledSelector,
} from "~/reducers/settings";
import {
  setAnalytics,
  setAnalyticsConsentInfo,
  setPersonalizedRecommendations,
} from "~/actions/settings";
import SettingsNavigationScrollView from "../../SettingsNavigationScrollView";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "~/context/Locale";

function valueLxColor(ok: boolean): "success" | "error" {
  return ok ? "success" : "error";
}

export default function DebugAnalyticsConsentQA() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const feature = useFeature("analyticsOptIn");
  const { policyVersion, consentValidityDays } = resolveAnalyticsOptInParams(feature);
  const consentInfo = useSelector(analyticsConsentInfoSelector);
  const analyticsEnabled = useSelector(analyticsEnabledSelector);
  const personalizedEnabled = useSelector(personalizedRecommendationsEnabledSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const storedVersionOk = !needsPrivacyPolicyAck(consentInfo.privacyPolicyVersion, policyVersion);
  const consentDateOk = !needsConsentRenewal(consentInfo.consentDate, consentValidityDays);

  const expectation = useMemo(() => {
    const analyticsOptInFeatureEnabled = Boolean(feature?.enabled);
    if (!analyticsOptInFeatureEnabled) {
      return { shouldOffer: false as const, phase: null, reason: "featureOff" as const };
    }
    if (!hasCompletedOnboarding) {
      return { shouldOffer: false as const, phase: null, reason: "onboardingIncomplete" as const };
    }
    const needsUpdatePrivacy = needsPrivacyPolicyAck(
      consentInfo.privacyPolicyVersion,
      policyVersion,
    );
    const needsRenewal = needsConsentRenewal(consentInfo.consentDate, consentValidityDays);
    if (!needsUpdatePrivacy && !needsRenewal) {
      return { shouldOffer: false as const, phase: null, reason: "nothingToRenew" as const };
    }
    const phase = resolveAnalyticsConsentPhase(
      "closed",
      needsRenewal,
      needsUpdatePrivacy,
      analyticsEnabled,
    );
    if (phase === "closed") {
      return { shouldOffer: false as const, phase: null, reason: "nothingToRenew" as const };
    }
    return { shouldOffer: true as const, phase };
  }, [
    analyticsEnabled,
    feature?.enabled,
    hasCompletedOnboarding,
    consentInfo.consentDate,
    consentInfo.privacyPolicyVersion,
    policyVersion,
    consentValidityDays,
  ]);

  const expectedModalLines = useMemo(() => {
    if (!expectation.shouldOffer) {
      const lines: string[] = ["No modal on portfolio (home) in this state."];
      if (expectation.reason === "featureOff") {
        lines.push("Reason: analytics opt-in feature flag is off.");
      } else if (expectation.reason === "onboardingIncomplete") {
        lines.push("Reason: onboarding is not complete.");
      } else {
        lines.push("Reason: policy version and consent date do not require a prompt.");
      }
      return lines;
    }
    const titles: Record<typeof expectation.phase, string> = {
      consentFresh: "First-time consent sheet (AnalyticsConsentDrawer — consent fresh).",
      consentReconfirm: "Reconfirm consent sheet (AnalyticsConsentDrawer — reconfirm).",
      privacy: "Privacy update sheet (AnalyticsConsentDrawer — policy update).",
    };
    return [titles[expectation.phase]];
  }, [expectation]);

  const onOutdateVersion = () => {
    const outdated = Math.max(0, policyVersion - 1);
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: consentInfo.consentDate,
        privacyPolicyVersion: outdated,
      }),
    );
  };

  const onRemoveDate = () => {
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: null,
        privacyPolicyVersion: consentInfo.privacyPolicyVersion,
      }),
    );
  };

  const commitConsentDate = (date: Date) => {
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: date.toISOString(),
        privacyPolicyVersion: consentInfo.privacyPolicyVersion,
      }),
    );
  };

  const onSetConsentOneYearAgo = () => {
    const d = new Date();
    d.setUTCFullYear(d.getUTCFullYear() - 1);
    commitConsentDate(d);
  };

  const onResetConsentFresh = () => {
    dispatch(
      setAnalyticsConsentInfo({
        consentDate: null,
        privacyPolicyVersion: null,
      }),
    );
    dispatch(setAnalytics(false));
    dispatch(setPersonalizedRecommendations(false));
  };

  const expectedModalLxColor = expectation.shouldOffer ? "error" : "success";

  return (
    <SettingsNavigationScrollView>
      <TrackScreen category="Settings" name="DebugAnalyticsConsentQA" />
      <Box lx={{ paddingHorizontal: "s24", paddingBottom: "s16" }}>
        <Text
          typography="body2SemiBold"
          lx={{ color: "muted", marginBottom: "s12" }}
          style={{ textTransform: "uppercase" }}
        >
          Analytics opt-in consent — QA
        </Text>

        <Text typography="heading5SemiBold" lx={{ color: "base", marginBottom: "s8" }}>
          Current settings
        </Text>

        <Text typography="body2" lx={{ color: "base", marginBottom: "s8" }}>
          {t("settings.display.analytics")}: {analyticsEnabled ? "On" : "Off"}
        </Text>
        <Text typography="body2" lx={{ color: "base", marginBottom: "s16" }}>
          {t("settings.display.personalizedRecommendations")}: {personalizedEnabled ? "On" : "Off"}
        </Text>

        <Text typography="body3" lx={{ color: "muted", marginBottom: "s4" }}>
          App privacy policy version (config)
        </Text>
        <Text typography="body2SemiBold" lx={{ color: "base", marginBottom: "s16" }}>
          {String(policyVersion)}
        </Text>

        <Box
          lx={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "s8",
          }}
        >
          <Box lx={{ flex: 1, marginRight: "s12" }}>
            <Text typography="body3" lx={{ color: "muted" }}>
              Stored privacy policy version
            </Text>
            <Text typography="body2SemiBold" lx={{ color: valueLxColor(storedVersionOk) }}>
              {consentInfo.privacyPolicyVersion === null
                ? "null"
                : String(consentInfo.privacyPolicyVersion)}
            </Text>
          </Box>
          <Button appearance="accent" size="sm" onPress={onOutdateVersion}>
            Outdate version
          </Button>
        </Box>

        <Box lx={{ marginBottom: "s16" }}>
          <Text typography="body3" lx={{ color: "muted", marginBottom: "s4" }}>
            Consent date (raw)
          </Text>
          <Text typography="body2SemiBold" lx={{ color: valueLxColor(consentDateOk) }} selectable>
            {consentInfo.consentDate === null ? "null" : consentInfo.consentDate}
          </Text>
          <Box
            lx={{
              display: "flex",
              flexDirection: "row",
              width: "full",
              gap: "s8",
              marginTop: "s12",
            }}
          >
            <Button appearance="accent" size="sm" onPress={onSetConsentOneYearAgo}>
              Set to one year ago
            </Button>
            <Button appearance="accent" size="sm" onPress={onRemoveDate}>
              Remove date
            </Button>
          </Box>
        </Box>

        <Text typography="heading5SemiBold" lx={{ color: "base", marginBottom: "s8" }}>
          Expected modal on portfolio (home)
        </Text>
        {expectedModalLines.map(line => (
          <Text
            key={line}
            typography="body2"
            lx={{ color: expectedModalLxColor, marginBottom: "s4" }}
          >
            {line}
          </Text>
        ))}
        <Text typography="body3" lx={{ color: "muted", marginBottom: "s16", marginTop: "s8" }}>
          Open portfolio (home) while this screen is closed — the drawer uses the same rules as in
          production.
        </Text>

        <Button appearance="red" onPress={onResetConsentFresh} isFull lx={{ marginBottom: "s24" }}>
          Reset for consent fresh
        </Button>
      </Box>
    </SettingsNavigationScrollView>
  );
}
