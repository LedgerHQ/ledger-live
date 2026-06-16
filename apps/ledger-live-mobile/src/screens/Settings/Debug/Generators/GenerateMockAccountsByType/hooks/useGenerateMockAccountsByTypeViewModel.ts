import { useCallback, useState } from "react";
import { Alert as Confirm } from "react-native";
import { Account } from "@ledgerhq/types-live";
import { useDispatch } from "~/context/hooks";
import { replaceAccounts } from "~/actions/accounts";
import { reboot } from "~/actions/appstate";
import { useStablecoinTokens } from "./useStablecoinTokens";
import { useStockTokens } from "./useStockTokens";
import { MAINNET_CURRENCIES, TESTNET_CURRENCIES } from "../constants";
import { generateCryptoAccounts, buildNetworkTokenAccounts } from "../utils";

export interface GenerateMockAccountsByTypeViewModelResult {
  includeCryptos: boolean;
  includeStablecoins: boolean;
  includeStocks: boolean;
  includeTestnet: boolean;
  countInput: string;
  stablecoinsLoading: boolean;
  stocksLoading: boolean;
  isValid: boolean;
  isReady: boolean;
  onToggleCryptos: (v: boolean) => void;
  setIncludeStablecoins: (v: boolean) => void;
  setIncludeStocks: (v: boolean) => void;
  onToggleTestnet: (v: boolean) => void;
  setCountInput: (v: string) => void;
  onGenerate: () => void;
}

export function useGenerateMockAccountsByTypeViewModel(): GenerateMockAccountsByTypeViewModelResult {
  const dispatch = useDispatch();

  const [includeCryptos, setIncludeCryptos] = useState(true);
  const [includeStablecoins, setIncludeStablecoins] = useState(true);
  const [includeStocks, setIncludeStocks] = useState(true);
  const [includeTestnet, setIncludeTestnet] = useState(false);
  const [countInput, setCountInput] = useState("10");

  const {
    ethereumTokens,
    tronTokens,
    algorandTokens,
    loading: stablecoinsLoading,
  } = useStablecoinTokens(includeStablecoins);

  const { tokensByParent: stockTokensByParent, loading: stocksLoading } =
    useStockTokens(includeStocks);

  const isValid = includeCryptos || includeStablecoins || includeStocks;
  const isReady =
    isValid && (!includeStablecoins || !stablecoinsLoading) && (!includeStocks || !stocksLoading);

  const onToggleCryptos = useCallback((v: boolean) => {
    setIncludeCryptos(v);
    if (!v) setIncludeTestnet(false);
  }, []);

  const onToggleTestnet = useCallback((v: boolean) => {
    setIncludeTestnet(v);
    if (v) setIncludeCryptos(true);
  }, []);

  const onGenerate = useCallback(() => {
    const parsedCount = Number.parseInt(countInput, 10);
    const count = Math.max(1, Number.isNaN(parsedCount) ? 10 : parsedCount);

    const onConfirm = () => {
      const accounts: Account[] = [];

      if (includeCryptos) {
        const cryptoPool = includeTestnet
          ? [...MAINNET_CURRENCIES, ...TESTNET_CURRENCIES]
          : MAINNET_CURRENCIES;
        accounts.push(...generateCryptoAccounts(cryptoPool, count));
      }

      if (includeStablecoins) {
        accounts.push(
          ...buildNetworkTokenAccounts([
            { parentId: "ethereum", tokens: ethereumTokens },
            { parentId: "tron", tokens: tronTokens },
            { parentId: "algorand", tokens: algorandTokens },
          ]),
        );
      }

      if (includeStocks) {
        accounts.push(...buildNetworkTokenAccounts(stockTokensByParent));
      }

      if (accounts.length === 0) {
        Confirm.alert(
          "No accounts generated",
          "Account data could not be loaded. Please try again.",
        );
        return;
      }

      dispatch(replaceAccounts(accounts));
      dispatch(reboot());
    };

    Confirm.alert(
      "This will erase existing accounts",
      "Continue?",
      [
        { text: "Ok", onPress: onConfirm },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        { text: "Cancel", onPress: () => {} },
      ],
      { cancelable: true },
    );
  }, [
    algorandTokens,
    countInput,
    dispatch,
    ethereumTokens,
    includeCryptos,
    includeStablecoins,
    includeStocks,
    includeTestnet,
    stockTokensByParent,
    tronTokens,
  ]);

  return {
    includeCryptos,
    includeStablecoins,
    includeStocks,
    includeTestnet,
    countInput,
    stablecoinsLoading,
    stocksLoading,
    isValid,
    isReady,
    onToggleCryptos,
    setIncludeStablecoins,
    setIncludeStocks,
    onToggleTestnet,
    setCountInput,
    onGenerate,
  };
}
