import { useDispatch, useSelector } from "LLD/hooks/redux";
import { TopBarAction } from "../types";
import { useTranslation } from "react-i18next";
import { discreetModeSelector } from "~/renderer/reducers/settings";
import { setDiscreetMode } from "~/renderer/actions/settings";
import { Eye, EyeCross } from "@ledgerhq/lumen-ui-react/symbols";
import { useMemo } from "react";

const useTopBarViewModel = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const discreetMode = useSelector(discreetModeSelector);
  const discreetIcon = useMemo(() => (discreetMode ? EyeCross : Eye), [discreetMode]);

  const topBarActionsList: TopBarAction[] = [
    {
      label: "discreet",
      tooltip: t("settings.discreet"),
      icon: discreetIcon,
      isInteractive: true,
      onClick: () => dispatch(setDiscreetMode(!discreetMode)),
    },
  ];

  return {
    topBarActionsList,
  };
};

export default useTopBarViewModel;
