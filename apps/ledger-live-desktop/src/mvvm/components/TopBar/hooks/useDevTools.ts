import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { Code } from "@ledgerhq/lumen-ui-react/symbols";
import { developerModeSelector } from "~/renderer/reducers/settings";
import { openDevToolsWindow } from "LLD/features/DevTools/components/DevToolsWindow/devToolsWindow";

export const useDevTools = () => {
  const { t } = useTranslation();
  const isVisible = useSelector(developerModeSelector);

  return {
    isVisible,
    handleDevTools: openDevToolsWindow,
    icon: Code,
    tooltip: t("common.devTools"),
  };
};
