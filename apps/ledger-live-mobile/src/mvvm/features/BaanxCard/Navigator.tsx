import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { Platform } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { ScreenName } from "~/const";
import {
  createLumenNativeStackNavigator,
  getStackNavigationConfigV4,
} from "~/mvvm/components/Navigation";
import { selectPendingAgentTopUps, clearPendingAgentTopUps } from "~/reducers/baanxTopUp";
import { BaanxLoginScreen } from "./screens/BaanxLoginScreen";
import { BaanxDashboardScreen } from "./screens/BaanxDashboardScreen";
import { AgentDetailScreen } from "./screens/AgentDetailScreen";
import type { BaanxCardNavigatorParamList } from "./types";
import type { AgentData, AgentActivityItem } from "./screens/BaanxDashboardScreen/mockAgentsData";
import { MOCK_AGENTS } from "./screens/BaanxDashboardScreen/mockAgentsData";
import { AgentsProvider } from "./AgentsContext";

interface BaanxAuthContextValue {
  accessToken: string | null;
  setAccessToken: (token: string) => void;
}

const BaanxAuthContext = createContext<BaanxAuthContextValue>({
  accessToken: null,
  setAccessToken: () => {},
});

export function useBaanxAuth() {
  return useContext(BaanxAuthContext);
}

const Stack = createLumenNativeStackNavigator<BaanxCardNavigatorParamList>();

export default function BaanxCardNavigator() {
  const { theme } = useTheme();
  // TODO: remove – bypass login for dev
  const [accessToken, setAccessTokenRaw] = useState<string | null>(null);

  const setAccessToken = useCallback((token: string) => {
    setAccessTokenRaw(token);
  }, []);

  const authValue = useMemo(() => ({ accessToken, setAccessToken }), [accessToken, setAccessToken]);

  const [agents, setAgents] = useState<readonly AgentData[]>(MOCK_AGENTS);
  const agentsValue = useMemo(() => ({ agents, setAgents }), [agents]);

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
          id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

  const isAuthenticated = accessToken !== null;

  const stackNavigationConfig = useMemo(() => getStackNavigationConfigV4(theme), [theme]);

  return (
    <BaanxAuthContext.Provider value={authValue}>
      <AgentsProvider value={agentsValue}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            gestureEnabled: Platform.OS === "ios",
          }}
          initialRouteName={
            isAuthenticated ? ScreenName.BaanxCardDashboard : ScreenName.BaanxCardLogin
          }
        >
          {isAuthenticated ? (
            <>
              <Stack.Screen name={ScreenName.BaanxCardDashboard} component={BaanxDashboardScreen} />
              <Stack.Screen
                name={ScreenName.AgentDetail}
                component={AgentDetailScreen}
                options={{
                  ...stackNavigationConfig,
                  title: "Agent",
                }}
              />
            </>
          ) : (
            <Stack.Screen name={ScreenName.BaanxCardLogin} component={BaanxLoginScreen} />
          )}
        </Stack.Navigator>
      </AgentsProvider>
    </BaanxAuthContext.Provider>
  );
}
