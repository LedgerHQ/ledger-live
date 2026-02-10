import { TopBarAction } from "../types";
import { useActivityIndicator } from "./useActivityIndicator";
import { useDiscreetMode } from "./useDiscreetMode";

const useTopBarViewModel = () => {
  const { handleDiscreet, discreetIcon, tooltip: discreetTooltip } = useDiscreetMode();

  const {
    hasAccounts,
    handleSync,
    isDisabled,
    icon: activityIndicatorIcon,
    tooltip,
  } = useActivityIndicator();

  const topBarActionsList: TopBarAction[] = [
    ...(hasAccounts
      ? [
          {
            label: "synchronize",
            tooltip: tooltip,
            icon: activityIndicatorIcon,
            isInteractive: !isDisabled,
            onClick: handleSync,
          },
        ]
      : []),
    {
      label: "discreet",
      tooltip: discreetTooltip,
      icon: discreetIcon,
      isInteractive: true,
      onClick: handleDiscreet,
    },
  ];

  return {
    topBarActionsList,
  };
};

export default useTopBarViewModel;
