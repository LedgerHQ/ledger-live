import { TopBarSlot } from "../types";
import { useActivityIndicator } from "./useActivityIndicator";
import { useDiscreetMode } from "./useDiscreetMode";

const useTopBarViewModel = () => {
  const { handleDiscreet, discreetIcon, tooltip: discreetTooltip } = useDiscreetMode();
  const {
    hasAccounts,
    handleSync,
    isDisabled,
    icon: activityIndicatorIcon,
    tooltip: activityIndicatorTooltip,
  } = useActivityIndicator();

  const topBarSlots: TopBarSlot[] = [
    ...(hasAccounts
      ? [
          {
            type: "action" as const,
            action: {
              label: "synchronize",
              tooltip: activityIndicatorTooltip,
              icon: activityIndicatorIcon,
              isInteractive: !isDisabled,
              onClick: handleSync,
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
  ];

  return {
    topBarSlots,
  };
};

export default useTopBarViewModel;
