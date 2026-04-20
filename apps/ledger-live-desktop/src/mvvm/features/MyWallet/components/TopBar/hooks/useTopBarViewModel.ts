import { useSettings } from "LLD/components/TopBar/hooks/useSettings";
import type { TopBarAction } from "LLD/components/TopBar/types";

const useTopBarViewModel = () => {
  const { handleSettings, settingsIcon, tooltip: settingsTooltip } = useSettings("mywallet");

  const settingsAction: TopBarAction = {
    label: "settings",
    tooltip: settingsTooltip,
    icon: settingsIcon,
    isInteractive: true,
    onClick: handleSettings,
  };

  return { settingsAction };
};

export default useTopBarViewModel;
