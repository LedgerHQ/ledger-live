import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import Box from "~/renderer/components/Box";
import { Flex, Text, Icons } from "@ledgerhq/react-ui";
import {
  analyticsConsentInfoSelector,
  hasCompletedOnboardingSelector,
  shareAnalyticsSelector,
} from "~/renderer/reducers/settings";
import {
  DANGEROUSLY_resetAnalyticsOptInStateForQa,
  DANGEROUSLY_setAnalyticsConsentInfoForQa,
} from "~/renderer/actions/settings";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@ledgerhq/live-common/privacyConsent";
import {
  needsConsentRenewal,
  needsPrivacyPolicyAck,
  resolveAnalyticsConsentPhase,
} from "@ledgerhq/live-common/analyticsConsentUtils";

/** Theme token: OK / up to date */
const COLOR_FRESH = "success.c70";
/** Theme token: stale / action needed */
const COLOR_OUTDATED = "error.c70";

const formatConsentDate = (value: string | null) => {
  if (value === null) return "null";
  if (value === "") return '""';
  return value;
};

const rowWithActionStyle = {
  alignItems: "center" as const,
  justifyContent: "space-between" as const,
  flexWrap: "wrap" as const,
  columnGap: 5,
  rowGap: 2,
};

export function AnalyticsConsentOptInDevScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const consentInfo = useSelector(analyticsConsentInfoSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const shareAnalytics = useSelector(shareAnalyticsSelector);
  const analyticsOptInFeature = useFeature("analyticsOptIn");

  const needsPrivacy = needsPrivacyPolicyAck(consentInfo.privacyPolicyVersion);
  const needsRenewal = needsConsentRenewal(consentInfo.consentDate);

  const shouldOfferModal = Boolean(
    analyticsOptInFeature?.enabled && hasCompletedOnboarding && (needsPrivacy || needsRenewal),
  );

  const modalPhaseIfOffered = resolveAnalyticsConsentPhase(
    "closed",
    needsRenewal,
    needsPrivacy,
    shareAnalytics,
  );

  const modalPreview = (() => {
    if (!hasCompletedOnboarding) {
      return {
        messageKey: "modalPreviewNoModalOnboarding" as const,
        color: "neutral.c70" as const,
      };
    }
    if (!analyticsOptInFeature?.enabled) {
      return {
        messageKey: "modalPreviewNoModalFeatureOff" as const,
        color: "neutral.c70" as const,
      };
    }
    if (!shouldOfferModal) {
      return { messageKey: "modalPreviewNoModalUserOk" as const, color: COLOR_FRESH };
    }
    if (modalPhaseIfOffered === "consentReconfirm") {
      return { messageKey: "modalPreviewReconfirm" as const, color: "primary.c80" as const };
    }
    if (modalPhaseIfOffered === "consentFresh") {
      return { messageKey: "modalPreviewFresh" as const, color: "primary.c80" as const };
    }
    if (modalPhaseIfOffered === "privacy") {
      return { messageKey: "modalPreviewPrivacy" as const, color: "primary.c80" as const };
    }
    return { messageKey: "modalPreviewNoModalUserOk" as const, color: COLOR_FRESH };
  })();

  const onBack = () => {
    navigate("/settings/developer");
  };

  const onPrivacyOutdated = () => {
    dispatch(
      DANGEROUSLY_setAnalyticsConsentInfoForQa({
        privacyPolicyVersion: Math.max(0, CURRENT_PRIVACY_POLICY_VERSION - 1),
      }),
    );
  };

  const onRemoveConsentDate = () => {
    dispatch(DANGEROUSLY_setAnalyticsConsentInfoForQa({ consentDate: null }));
  };

  const onResetForConsentFresh = () => {
    dispatch(DANGEROUSLY_resetAnalyticsOptInStateForQa());
  };

  return (
    <Box grow shrink p={3}>
      <Flex justifyContent="space-between" alignItems="center" margin={4}>
        <Button
          size="sm"
          appearance="no-background"
          onClick={onBack}
          icon={() => <Icons.ArrowLeft size="S" />}
        >
          {t("common.back")}
        </Button>
        <Text variant="h2Inter" color="neutral.c100" margin={"0 auto"} fontSize={24} pr={50}>
          {t("settings.developer.analyticsConsentOptInQa.title")}
        </Text>
      </Flex>

      <Box py={2} px={5}>
        <Text variant="body" color="neutral.c80" fontWeight="semiBold" mb={3}>
          {t("settings.developer.analyticsConsentOptInQa.readSection")}
        </Text>
        <Flex flexDirection="column" rowGap={3} mb={6}>
          <Text variant="paragraph" color="neutral.c70">
            {t("settings.developer.analyticsConsentOptInQa.currentPrivacyVersion", {
              version: String(CURRENT_PRIVACY_POLICY_VERSION),
            })}
          </Text>
          <Flex flexDirection="row" {...rowWithActionStyle}>
            <Text
              variant="paragraph"
              color={needsPrivacy ? COLOR_OUTDATED : COLOR_FRESH}
              fontWeight="medium"
              flex="1"
              style={{ minWidth: 200 }}
            >
              {t("settings.developer.analyticsConsentOptInQa.storedPrivacyVersion", {
                version:
                  consentInfo.privacyPolicyVersion === null
                    ? "null"
                    : String(consentInfo.privacyPolicyVersion),
              })}
            </Text>
            <Button size="sm" appearance="accent" onClick={onPrivacyOutdated}>
              {t("settings.developer.analyticsConsentOptInQa.inlineOutdatePrivacyVersion")}
            </Button>
          </Flex>
          <Flex flexDirection="row" {...rowWithActionStyle}>
            <Text
              variant="paragraph"
              color={needsRenewal ? COLOR_OUTDATED : COLOR_FRESH}
              fontWeight="medium"
              flex="1"
              style={{ minWidth: 200 }}
            >
              {t("settings.developer.analyticsConsentOptInQa.consentDate", {
                value: formatConsentDate(consentInfo.consentDate),
              })}
            </Text>
            <Button size="sm" appearance="accent" onClick={onRemoveConsentDate}>
              {t("settings.developer.analyticsConsentOptInQa.inlineRemoveConsentDate")}
            </Button>
          </Flex>
        </Flex>

        <Text variant="body" color="neutral.c80" fontWeight="semiBold" mb={2} mt={2}>
          {t("settings.developer.analyticsConsentOptInQa.modalPreviewSection")}
        </Text>
        <Text variant="paragraph" color={modalPreview.color} fontWeight="medium" mb={2}>
          {t(`settings.developer.analyticsConsentOptInQa.${modalPreview.messageKey}`)}
        </Text>
        <Text variant="small" color="neutral.c60" mb={6}>
          {t("settings.developer.analyticsConsentOptInQa.modalPreviewGoToHome")}
        </Text>

        <Button size="sm" appearance="red" onClick={onResetForConsentFresh}>
          {t("settings.developer.analyticsConsentOptInQa.actionResetForConsentFresh")}
        </Button>

        <Text variant="small" color="neutral.c60" mt={5} style={{ maxWidth: 560 }}>
          {t("settings.developer.analyticsConsentOptInQa.note")}
        </Text>
      </Box>
    </Box>
  );
}
