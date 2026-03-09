import { useLocation } from "react-router";
import { TopBarSlot } from "../types";
import { useActivityIndicator } from "./useActivityIndicator";
import { useDiscreetMode } from "./useDiscreetMode";
import { useMyLedger } from "./useMyLedger";
import { useSettings } from "./useSettings";

const useTopBarViewModel = () => {
  const { handleDiscreet, discreetIcon, tooltip: discreetTooltip } = useDiscreetMode();
  const {
    hasAccounts,
    handleSync,
    isRotating,
    icon: activityIndicatorIcon,
    tooltip: activityIndicatorTooltip,
    onTooltipShow: activityIndicatorOnTooltipShow,
  } = useActivityIndicator();
  const { handleSettings, settingsIcon, tooltip: settingsTooltip } = useSettings();
  const { handleMyLedger, tooltip: myLedgerTooltip, icon: myLedgerIcon } = useMyLedger();
  const location = useLocation();
  const inManager = location.pathname === "/manager";

  const topBarSlots: TopBarSlot[] = [
    ...(hasAccounts
      ? [
          {
            type: "action" as const,
            action: {
              label: "synchronize",
              tooltip: activityIndicatorTooltip,
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
    {
      type: "action",
      action: {
        label: "settings",
        tooltip: settingsTooltip,
        icon: settingsIcon,
        isInteractive: true,
        onClick: handleSettings,
      },
    },
    {
      type: "action",
      action: {
        label: "my ledger",
        tooltip: myLedgerTooltip,
        icon: myLedgerIcon,
        isInteractive: true,
        onClick: handleMyLedger,
      },
    },
  ];

  return {
    topBarSlots,
    inManager,
  };
};

export default useTopBarViewModel;
