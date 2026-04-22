import { useCallback, useState } from "react";
import { Alert as Confirm } from "react-native";
import { Account } from "@ledgerhq/types-live";
import { useDispatch } from "~/context/hooks";
import { replaceAccounts } from "~/actions/accounts";
import { reboot } from "~/actions/appstate";
import { useStablecoinTokens } from "./useStablecoinTokens";
import { MAINNET_CURRENCIES, TESTNET_CURRENCIES, findCurrencyById } from "../constants";
import { generateCryptoAccounts, generateNetworkStablecoinAccount } from "../utils";

export interface GenerateMockAccountsByTypeViewModelResult {
  includeCryptos: boolean;
  includeStablecoins: boolean;
  includeTestnet: boolean;
  countInput: string;
  stablecoinsLoading: boolean;
  isValid: boolean;
  isReady: boolean;
  onToggleCryptos: (v: boolean) => void;
  setIncludeStablecoins: (v: boolean) => void;
  onToggleTestnet: (v: boolean) => void;
  setCountInput: (v: string) => void;
  onGenerate: () => void;
}

export function useGenerateMockAccountsByTypeViewModel(): GenerateMockAccountsByTypeViewModelResult {
  const dispatch = useDispatch();

  const [includeCryptos, setIncludeCryptos] = useState(true);
  const [includeStablecoins, setIncludeStablecoins] = useState(true);
  const [includeTestnet, setIncludeTestnet] = useState(false);
  const [countInput, setCountInput] = useState("10");

  const {
    ethereumTokens,
    tronTokens,
    algorandTokens,
    loading: stablecoinsLoading,
  } = useStablecoinTokens(includeStablecoins);

  const isValid = includeCryptos || includeStablecoins;
  const isReady = isValid && (!includeStablecoins || !stablecoinsLoading);

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
        // One account per supported network, each with all its stablecoin sub-accounts.
        // This produces 10 unique stablecoin types across ETH · Tron · Algorand.
        const eth = findCurrencyById("ethereum");
        if (eth && ethereumTokens.length > 0) {
          accounts.push(generateNetworkStablecoinAccount(eth, ethereumTokens));
        }

        const tron = findCurrencyById("tron");
        if (tron && tronTokens.length > 0) {
          accounts.push(generateNetworkStablecoinAccount(tron, tronTokens));
        }

        const algorand = findCurrencyById("algorand");
        if (algorand && algorandTokens.length > 0) {
          accounts.push(generateNetworkStablecoinAccount(algorand, algorandTokens));
        }
      }

      if (accounts.length === 0) {
        Confirm.alert(
          "No accounts generated",
          "Stablecoin data could not be loaded. Please try again.",
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
    includeTestnet,
    tronTokens,
  ]);

  return {
    includeCryptos,
    includeStablecoins,
    includeTestnet,
    countInput,
    stablecoinsLoading,
    isValid,
    isReady,
    onToggleCryptos,
    setIncludeStablecoins,
    onToggleTestnet,
    setCountInput,
    onGenerate,
  };
}
