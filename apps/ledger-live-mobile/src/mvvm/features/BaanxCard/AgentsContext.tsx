import React, { createContext, useContext, useCallback, useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { AgentData, AgentActivityItem } from "./screens/BaanxDashboardScreen/mockAgentsData";
import { MOCK_AGENTS } from "./screens/BaanxDashboardScreen/mockAgentsData";
import { selectPendingAgentTopUps, clearPendingAgentTopUps } from "~/reducers/baanxTopUp";

interface AgentsContextValue {
  agents: readonly AgentData[];
  setAgents: React.Dispatch<React.SetStateAction<readonly AgentData[]>>;
}

const AgentsContext = createContext<AgentsContextValue>({
  agents: MOCK_AGENTS,
  setAgents: () => {},
});

export const AgentsProvider = AgentsContext.Provider;

export function AgentsStateProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<readonly AgentData[]>(MOCK_AGENTS);
  const value = useMemo(() => ({ agents, setAgents }), [agents]);

  const dispatch = useDispatch();
  const pendingAgentTopUps = useSelector(selectPendingAgentTopUps);

  useEffect(() => {
    if (pendingAgentTopUps.length === 0) return;

    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    setAgents(prev =>
      prev.map(agent => {
        const topUps = pendingAgentTopUps.filter(t => t.agentId === agent.id);
        if (topUps.length === 0) return agent;

        const totalFunded = topUps.reduce((sum, t) => sum + t.amount, 0);
        const newEntries: AgentActivityItem[] = topUps.map(t => ({
          id: makeActivityId(),
          action: `Funded $${t.amount.toFixed(2)}`,
          date: today,
          amount: `+$${t.amount.toFixed(2)}`,
        }));

        const newBalance = agent.balance + totalFunded;
        const startValue = agent.pnlChartData.length > 0 ? agent.pnlChartData[0] : agent.balance;
        const newPnlAbsolute = newBalance - startValue;
        const newPnlPercent = startValue > 0 ? (newPnlAbsolute / startValue) * 100 : 0;
        return {
          ...agent,
          balance: newBalance,
          status: "active" as const,
          pnlAbsolute: newPnlAbsolute,
          pnlPercent: Math.round(newPnlPercent * 100) / 100,
          pnlChartData: [...agent.pnlChartData, newBalance],
          activity: [...newEntries, ...agent.activity],
        };
      }),
    );

    dispatch(clearPendingAgentTopUps());
  }, [pendingAgentTopUps, dispatch]);

  return <AgentsProvider value={value}>{children}</AgentsProvider>;
}

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
        prev.map(agent => {
          if (agent.id !== agentId) return agent;
          const newBalance = agent.balance + amount;
          const startValue = agent.pnlChartData.length > 0 ? agent.pnlChartData[0] : agent.balance;
          const newPnlAbsolute = newBalance - startValue;
          const newPnlPercent = startValue > 0 ? (newPnlAbsolute / startValue) * 100 : 0;
          return {
            ...agent,
            balance: newBalance,
            status: "active" as const,
            pnlAbsolute: newPnlAbsolute,
            pnlPercent: Math.round(newPnlPercent * 100) / 100,
            pnlChartData: [...agent.pnlChartData, newBalance],
            activity: [entry, ...agent.activity],
          };
        }),
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

          const newBalance = agent.balance - withdrawn;
          const startValue = agent.pnlChartData.length > 0 ? agent.pnlChartData[0] : agent.balance;
          const newPnlAbsolute = newBalance - startValue;
          const newPnlPercent = startValue > 0 ? (newPnlAbsolute / startValue) * 100 : 0;
          return {
            ...agent,
            balance: newBalance,
            pnlAbsolute: newPnlAbsolute,
            pnlPercent: Math.round(newPnlPercent * 100) / 100,
            pnlChartData: [...agent.pnlChartData, newBalance],
            activity: [entry, ...agent.activity],
          };
        }),
      );
    },
    [setAgents],
  );

  return { fundAgent, withdrawFromAgent };
}
