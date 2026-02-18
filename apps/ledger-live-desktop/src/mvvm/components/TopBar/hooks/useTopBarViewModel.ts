import { TopBarAction } from "../types";
import { useTranslation } from "react-i18next";
import { useActivityIndicator } from "./useActivityIndicator";
import { useDiscreetMode } from "./useDiscreetMode";

const useTopBarViewModel = () => {
  const { t } = useTranslation();
  const { handleDiscreet, discreetIcon } = useDiscreetMode();

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
      tooltip: t("settings.discreet"),
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
