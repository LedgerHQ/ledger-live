/* eslint-disable consistent-return */
import { useLayoutEffect, useRef, useState, useEffect, useMemo } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import type { StackNavigatorProps, BaseComposite } from "../RootNavigator/types/helpers";
import type { StakeNavigatorParamList } from "../RootNavigator/types/StakeNavigator";
import VersionNumber from "react-native-version-number";
import { useLazyLedgerCurrency } from "@ledgerhq/live-common/dada-client/hooks/useLazyLedgerCurrency";
import { useStakingDrawer } from "./useStakingDrawer";
import { useStake } from "LLM/hooks/useStake/useStake";
import { useOpenStakeDrawer } from "LLM/features/Stake";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

type Props = BaseComposite<StackNavigatorProps<StakeNavigatorParamList, ScreenName.Stake>>;

const StakeFlow = ({ route }: Props) => {
  const { enabledCurrencies, partnerSupportedAssets } = useStake();
  const currencies = useMemo(
    () => route?.params?.currencies || enabledCurrencies.concat(partnerSupportedAssets),
    [route?.params?.currencies, enabledCurrencies, partnerSupportedAssets],
  );
  const navigation = useNavigation<StackNavigationProp<{ [key: string]: object | undefined }>>();
  const parentRoute = route?.params?.parentRoute;
  const account = route?.params?.account;
  const alwaysShowNoFunds = route?.params?.alwaysShowNoFunds;

  const [ledgerCurrencies, setLedgerCurrencies] = useState<CryptoOrTokenCurrency[]>([]);

  const { getLedgerCurrencies } = useLazyLedgerCurrency({
    product: "llm",
    version: VersionNumber.appVersion,
  });

  // LIVE-23210: REMOVE THIS WHEN MAD IS ENABLED as it will be handled here
  //  customHandler: isModularDrawerEnabledStake ? handleOpenStakeDrawer : undefined,
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const result = (await getLedgerCurrencies(currencies)) || [];
        setLedgerCurrencies(result);
      } catch (error) {
        console.error("Failed to fetch ledger currencies:", error);
        setLedgerCurrencies([]);
      }
    };

    fetchCurrencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToAccountStakeFlow = useStakingDrawer({
    navigation,
    parentRoute,
    alwaysShowNoFunds,
    entryPoint: route?.params?.entryPoint,
  });

  const currency = ledgerCurrencies.length === 1 ? ledgerCurrencies[0] : undefined;

  const { handleOpenStakeDrawer, isModularDrawerEnabled } = useOpenStakeDrawer({
    currency,
    sourceScreenName: "stake_flow",
    enabledCurrencies: currencies,
  });

  const requestAccountRef = useRef(() => {});

  requestAccountRef.current = () => {
    if (isModularDrawerEnabled) {
      handleOpenStakeDrawer();
      return;
    } else {
      // Fallback to traditional navigation
      if (ledgerCurrencies.length === 1) {
        // Navigate to the second screen when there is only one currency
        navigation.replace(NavigatorName.RequestAccount, {
          screen: ScreenName.RequestAccountsSelectAccount,
          params: {
            currency: ledgerCurrencies[0],
            onSuccess: goToAccountStakeFlow,
            allowAddAccount: true, // if no account, need to be able to add one to get funds.
          },
        });
      } else {
        navigation.replace(NavigatorName.RequestAccount, {
          screen: ScreenName.RequestAccountsSelectCrypto,
          params: {
            currencies: ledgerCurrencies,
            allowAddAccount: true,
            onSuccess: goToAccountStakeFlow,
          },
        });
      }
    }
  };

  useLayoutEffect(() => {
    if (account) {
      goToAccountStakeFlow(account);
    } else {
      requestAccountRef.current();
    }
  }, [goToAccountStakeFlow, account, ledgerCurrencies]);

  return null;
};

export default StakeFlow;
