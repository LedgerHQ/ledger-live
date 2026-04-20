import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { LifeRing } from "@ledgerhq/lumen-ui-react/symbols";
import { track } from "~/renderer/analytics/segment";
import type { Action } from "./types";

export function useActionsListViewModel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const openHelp = useCallback(() => {
    track("button_clicked", {
      button: "Help",
      page: location.pathname,
      entry: "my_wallet_actions_list",
    });
    navigate("/settings/help");
  }, [location.pathname, navigate]);

  const actions = useMemo<Action[]>(
    () => [
      {
        icon: LifeRing,
        label: "1",
      },
      {
        icon: LifeRing,
        label: t("myWallet.actionsList.help"),
        onClick: openHelp,
      },
      {
        icon: LifeRing,
        label: "3",
      },
    ],
    [openHelp, t],
  );

  return { actions };
}
