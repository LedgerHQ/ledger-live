import { useCallback } from "react";
import { useNavigate } from "react-router";
import {
  AGENT_INTENT_SOURCE,
  trackManageAgentsClick,
  useAgentIntentEntryPoints,
} from "@features/flow-agent-intent-entry-points";
import { getAgentIntentPath } from "LLD/features/AgentIntent/getAgentIntentPath";
import { useContextMenuClose } from "../../ContextMenuContext";
import { MY_WALLET_TRACKING_PAGE_NAME } from "../../../constants";

type ManageAgentsButtonViewModel = Readonly<{
  isEnabled: boolean;
  openAgentIntent: () => void;
}>;

export function useManageAgentsButtonViewModel(): ManageAgentsButtonViewModel {
  const close = useContextMenuClose();
  const navigate = useNavigate();
  const { isProfileEnabled } = useAgentIntentEntryPoints();

  const openAgentIntent = useCallback(() => {
    trackManageAgentsClick(MY_WALLET_TRACKING_PAGE_NAME);
    navigate(getAgentIntentPath(AGENT_INTENT_SOURCE.profile));
    close();
  }, [close, navigate]);

  return { isEnabled: isProfileEnabled, openAgentIntent };
}
