import { useState, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  useGetCardStatusQuery,
  useGetTransactionsQuery,
} from "@ledgerhq/baanx";
import type { BaanxTransactionFilters } from "@ledgerhq/baanx";
import { getBaanxAccessToken, clearBaanxAccessToken } from "../BaanxLoginScreen/useBaanxLoginViewModel";

export function useBaanxDashboardViewModel() {
  const navigation = useNavigation<any>();
  const accessToken = getBaanxAccessToken() ?? "";
  const [filters, setFilters] = useState<BaanxTransactionFilters>({});

  const cardStatus = useGetCardStatusQuery(
    { accessToken },
    { skip: !accessToken },
  );

  const transactions = useGetTransactionsQuery(
    { accessToken, ...filters },
    { skip: !accessToken },
  );

  const logout = useCallback(() => {
    clearBaanxAccessToken();
    navigation.goBack();
  }, [navigation]);

  return {
    cardStatus,
    transactions,
    filters,
    setFilters,
    logout,
    isAuthenticated: !!accessToken,
  };
}
