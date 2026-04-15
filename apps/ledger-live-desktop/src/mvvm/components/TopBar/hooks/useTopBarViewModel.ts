import { useLocation } from "react-router";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/useWalletFeaturesConfig";
import { TopBarSlot } from "../types";
import { useActivityIndicator } from "./useActivityIndicator";
import { useDiscreetMode } from "./useDiscreetMode";
import { useExperimentalFeatures } from "./useExperimentalFeatures";
import { useFeatureFlags } from "./useFeatureFlags";
import { useHistory } from "./useHistory";

const useTopBarViewModel = () => {
  const { shouldDisplayOperationsList } = useWalletFeaturesConfig("desktop");
  const { handleDiscreet, discreetIcon, tooltip: discreetTooltip } = useDiscreetMode();
  const {
    hasAccounts,
    handleSync,
    isRotating,
    icon: activityIndicatorIcon,
    tooltip: activityIndicatorTooltip,
    onTooltipShow: activityIndicatorOnTooltipShow,
  } = useActivityIndicator();
  const { handleHistory, historyIcon, tooltip: historyTooltip, cta: historyCta } = useHistory();
  const {
    isVisible: isExperimentalVisible,
    handleExperimental,
    icon: experimentalIcon,
    tooltip: experimentalTooltip,
  } = useExperimentalFeatures();
  const {
    isVisible: isFeatureFlagsVisible,
    handleFeatureFlags,
    icon: featureFlagsIcon,
    tooltip: featureFlagsTooltip,
  } = useFeatureFlags();

  const location = useLocation();
  const inManager = location.pathname === "/manager";

  const topBarSlots: TopBarSlot[] = [
    ...(isExperimentalVisible
      ? [
          {
            type: "action" as const,
            action: {
              label: "experimental",
              tooltip: experimentalTooltip,
              icon: experimentalIcon,
              isInteractive: true,
              onClick: handleExperimental,
              appearance: "accent" as const,
            },
          },
        ]
      : []),
    ...(isFeatureFlagsVisible
      ? [
          {
            type: "action" as const,
            action: {
              label: "feature flags",
              tooltip: featureFlagsTooltip,
              icon: featureFlagsIcon,
              isInteractive: true,
              onClick: handleFeatureFlags,
              appearance: "accent" as const,
            },
          },
        ]
      : []),
    ...(hasAccounts
      ? [
          {
            type: "action" as const,
            action: {
              label: "synchronize",
              tooltip: activityIndicatorTooltip,
              tooltipClassName: "whitespace-pre-line max-w-md text-wrap break-words",
              icon: activityIndicatorIcon,
              isInteractive: !isRotating,
              onClick: handleSync,
              onTooltipShow: activityIndicatorOnTooltipShow,
            },
          },
        ]
      : []),
    { type: "notification" },
    {
      type: "action",
      action: {
        label: "discreet",
        tooltip: discreetTooltip,
        icon: discreetIcon,
        isInteractive: true,
        onClick: handleDiscreet,
      },
    },
    ...(shouldDisplayOperationsList
      ? [
          {
            type: "action" as const,
            action: {
              label: "history",
              tooltip: historyTooltip,
              icon: historyIcon,
              isInteractive: true,
              onClick: handleHistory,
              cta: historyCta,
            },
          },
        ]
      : []),
    { type: "avatar" },
  ];

  return {
    topBarSlots,
    inManager,
  };
};

export default useTopBarViewModel;
