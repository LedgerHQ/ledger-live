import { createContext, useContext, useCallback } from "react";
import type { AgentData, AgentActivityItem } from "./screens/BaanxDashboardScreen/mockAgentsData";
import { MOCK_AGENTS } from "./screens/BaanxDashboardScreen/mockAgentsData";

interface AgentsContextValue {
  agents: readonly AgentData[];
  setAgents: React.Dispatch<React.SetStateAction<readonly AgentData[]>>;
}

const AgentsContext = createContext<AgentsContextValue>({
  agents: MOCK_AGENTS,
  setAgents: () => {},
});

export const AgentsProvider = AgentsContext.Provider;

export function useAgentsContext() {
  return useContext(AgentsContext);
}

function makeActivityId(): string {
  return `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function todayFormatted(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function useAgentActions() {
  const { setAgents } = useAgentsContext();

  const fundAgent = useCallback(
    (agentId: string, amount: number) => {
      const entry: AgentActivityItem = {
        id: makeActivityId(),
        action: `Funded $${amount.toFixed(2)}`,
        date: todayFormatted(),
        amount: `+$${amount.toFixed(2)}`,
      };

      setAgents(prev =>
        prev.map(agent =>
          agent.id === agentId
            ? {
                ...agent,
                balance: agent.balance + amount,
                status: "active" as const,
                activity: [entry, ...agent.activity],
              }
            : agent,
        ),
      );
    },
    [setAgents],
  );

  const withdrawFromAgent = useCallback(
    (agentId: string, amount: number) => {
      setAgents(prev =>
        prev.map(agent => {
          if (agent.id !== agentId) return agent;
          const withdrawn = Math.min(amount, agent.balance);
          if (withdrawn <= 0) return agent;

          const entry: AgentActivityItem = {
            id: makeActivityId(),
            action: `Withdrew $${withdrawn.toFixed(2)}`,
            date: todayFormatted(),
            amount: `-$${withdrawn.toFixed(2)}`,
          };

          return {
            ...agent,
            balance: agent.balance - withdrawn,
            activity: [entry, ...agent.activity],
          };
        }),
      );
    },
    [setAgents],
  );

  return { fundAgent, withdrawFromAgent };
}
