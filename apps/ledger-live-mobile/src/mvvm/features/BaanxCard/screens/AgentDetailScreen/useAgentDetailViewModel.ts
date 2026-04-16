import { useMemo, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type {
  AgentData,
  AgentActivityItem,
  AgentStatus,
} from "../BaanxDashboardScreen/mockAgentsData";
import { useAgentsContext, useAgentActions } from "../../AgentsContext";
import { NavigatorName, ScreenName } from "~/const";
import {
  UserCircle,
  UserShield,
  UserCheck,
  UserArrowRight,
  UserLock,
} from "@ledgerhq/lumen-ui-rnative/symbols";

const ICON_MAP: Record<AgentData["icon"], typeof UserCircle> = {
  UserCircle,
  UserShield,
  UserCheck,
  UserArrowRight,
  UserLock,
};

function formatFiat(value: number): { integer: string; decimal: string } {
  const [int, dec] = value.toFixed(2).split(".");
  return { integer: `$${int}`, decimal: `.${dec}` };
}

export interface AgentDetailViewModel {
  readonly found: boolean;
  readonly name: string;
  readonly status: AgentStatus;
  readonly iconComponent: typeof UserCircle;
  readonly balanceInteger: string;
  readonly balanceDecimal: string;
  readonly pnlPercent: number;
  readonly pnlPeriod: string;
  readonly pnlIsPositive: boolean;
  readonly role: string;
  readonly activity: readonly AgentActivityItem[];
  readonly onFundAgent: () => void;
  readonly onWithdraw: () => void;
}

export function useAgentDetailViewModel(agentId: string): AgentDetailViewModel {
  const { agents } = useAgentsContext();
  const { withdrawFromAgent } = useAgentActions();
  const navigation = useNavigation();
  const agent = useMemo(() => agents.find(a => a.id === agentId), [agents, agentId]);

  const { integer, decimal } = useMemo(() => formatFiat(agent?.balance ?? 0), [agent?.balance]);

  const onFundAgent = useCallback(() => {
    (navigation as NativeStackNavigationProp<{ [key: string]: object }>).navigate(
      NavigatorName.BaanxTopUp,
      {
        screen: ScreenName.BaanxTopUpAmount,
        params: {
          account: null,
          parentAccount: undefined,
          baanxAddress: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
          coinTicker: "XRP",
          agentId,
        },
      },
    );
  }, [navigation, agentId]);

  const onWithdraw = useCallback(() => {
    if (agent && agent.balance > 0) {
      withdrawFromAgent(agentId, agent.balance);
    }
  }, [agent, agentId, withdrawFromAgent]);

  return {
    found: !!agent,
    name: agent?.name ?? "Unknown Agent",
    status: agent?.status ?? "idle",
    iconComponent: ICON_MAP[agent?.icon ?? "UserCircle"],
    balanceInteger: integer,
    balanceDecimal: decimal,
    pnlPercent: agent?.pnlPercent ?? 0,
    pnlPeriod: agent?.pnlPeriod ?? "7d",
    pnlIsPositive: (agent?.pnlPercent ?? 0) >= 0,
    role: agent?.role ?? "",
    activity: agent?.activity ?? [],
    onFundAgent,
    onWithdraw,
  };
}
