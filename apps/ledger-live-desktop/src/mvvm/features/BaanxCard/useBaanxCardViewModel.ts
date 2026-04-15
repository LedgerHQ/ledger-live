import { useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  BAANX_WEB_APP_URL,
  useGetUserCardQuery,
  useGetUserWalletsQuery,
  useGetLoansQuery,
  useGetStakingDealsQuery,
  useGetSettingsQuery,
  useGetCheckPINQuery,
} from "@ledgerhq/baanx";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import type { ApiLogEntry } from "./components/BaanxLoginForm";

export interface QueryResult {
  label: string;
  data?: unknown;
  isLoading: boolean;
  error?: unknown;
}

export interface BaanxCardViewModel {
  isAuthenticated: boolean;
  accessToken: string | null;
  fiatCurrency: string;
  webViewStorage: Record<string, string>;
  apiLog: ApiLogEntry[];
  apiResults: QueryResult[];
  webAppUrl: string;
  onStorageExtracted: (storage: Record<string, string>) => void;
  onApiLogUpdated: (log: ApiLogEntry[]) => void;
  logout: () => void;
  navigateBack: () => void;
}

const TOKEN_KEYS = ["access_token", "accesstoken", "token", "auth_token", "jwt"];

function findTokenInStorage(storage: Record<string, string>): string | null {
  for (const [key, value] of Object.entries(storage)) {
    const lk = key.toLowerCase();
    for (const candidate of TOKEN_KEYS) {
      if (lk.includes(candidate) && value && value.length > 20) {
        return value;
      }
    }
  }
  return null;
}

function pick(q: { data?: unknown; isLoading: boolean; error?: unknown }) {
  return { data: q.data, isLoading: q.isLoading, error: q.error };
}

function useBaanxQueries(accessToken: string | null): QueryResult[] {
  const token = accessToken ?? "";
  const skip = !token;

  const userCard = useGetUserCardQuery({ accessToken: token }, { skip });
  const userWallets = useGetUserWalletsQuery({ accessToken: token }, { skip });
  const loans = useGetLoansQuery({ accessToken: token }, { skip });
  const stakingDeals = useGetStakingDealsQuery({ accessToken: token }, { skip });
  const settings = useGetSettingsQuery({ accessToken: token }, { skip });
  const checkPIN = useGetCheckPINQuery({ accessToken: token }, { skip });

  return useMemo(
    () => [
      { label: "User Card", ...pick(userCard) },
      { label: "User Wallets", ...pick(userWallets) },
      { label: "Loans / Stableloans", ...pick(loans) },
      { label: "Staking Deals", ...pick(stakingDeals) },
      { label: "Settings", ...pick(settings) },
      { label: "Card PIN Status", ...pick(checkPIN) },
    ],
    [userCard, userWallets, loans, stakingDeals, settings, checkPIN],
  );
}

export function useBaanxCardViewModel(): BaanxCardViewModel {
  const navigate = useNavigate();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const fiatCurrency = counterValueCurrency.ticker ?? "EUR";
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [webViewStorage, setWebViewStorage] = useState<Record<string, string>>({});
  const [apiLog, setApiLog] = useState<ApiLogEntry[]>([]);

  const apiResults = useBaanxQueries(accessToken);

  const onStorageExtracted = useCallback(
    (storage: Record<string, string>) => {
      setWebViewStorage(storage);
      const token = findTokenInStorage(storage);
      if (token && token !== accessToken) {
        setAccessToken(token);
      }
    },
    [accessToken],
  );

  const onApiLogUpdated = useCallback((log: ApiLogEntry[]) => {
    setApiLog(log);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setWebViewStorage({});
    setApiLog([]);
  }, []);

  const navigateBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  return {
    isAuthenticated: accessToken !== null,
    accessToken,
    fiatCurrency,
    webViewStorage,
    apiLog,
    apiResults,
    webAppUrl: BAANX_WEB_APP_URL,
    onStorageExtracted,
    onApiLogUpdated,
    logout,
    navigateBack,
  };
}
