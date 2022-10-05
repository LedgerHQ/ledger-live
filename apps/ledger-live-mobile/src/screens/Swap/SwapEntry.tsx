import React, { useState, useEffect } from "react";
import Config from "react-native-config";
import { StyleSheet, View } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, useRoute, useNavigation } from "@react-navigation/native";
import { getProviders } from "@ledgerhq/live-common/exchange/swap/index";
import { getSwapSelectableCurrencies } from "@ledgerhq/live-common/exchange/swap/logic";
import type {
  AvailableProvider,
  AvailableProviderV3,
} from "@ledgerhq/live-common/exchange/swap/types";
import NotAvailable from "./NotAvailable";
import { swapKYCSelector } from "../../reducers/settings";
import { setSwapSelectableCurrencies } from "../../actions/settings";
import { ScreenName } from "../../const";
import Spinning from "../../components/Spinning";
import BigSpinner from "../../icons/BigSpinner";
import type { SwapNavigatorParamList } from "../../components/RootNavigator/types/SwapNavigator";
import type {
  StackNavigatorNavigation,
  StackNavigatorRoute,
} from "../../components/RootNavigator/types/helpers";

export const useProviders = () => {
  const dispatch = useDispatch();
  const [providers, setProviders] = useState<AvailableProvider[]>();
  const [provider, setProvider] = useState<string>();
  useEffect(() => {
    getProviders().then(providers => {
      let resultProvider;
      const disabledProviders = Config.SWAP_DISABLED_PROVIDERS || "ftx,ftxus";
      const providersByName = providers.reduce<{
        [key: string]: AvailableProvider;
      }>((acc, providerData) => {
        if (!disabledProviders.includes(providerData.provider)) {
          acc[providerData.provider] = providerData;
        }

        return acc;
      }, {});

      // Prio to changelly if both are available
      if ("wyre" in providersByName && "changelly" in providersByName) {
        resultProvider = providersByName.changelly;
      } else {
        resultProvider = providers.find(
          p => !disabledProviders.includes(p.provider),
        );
      }

      // FIXME: SEEMS TO BE ONLY USING PROVIDERSV3, CAN WE DROP V2 ?
      // Only set as available currencies from this provider, on swp-agg this changes
      if (resultProvider) {
        dispatch(
          setSwapSelectableCurrencies(
            getSwapSelectableCurrencies([
              resultProvider as AvailableProviderV3,
            ]),
          ),
        );
        setProviders([resultProvider]);
        setProvider(resultProvider.provider);
      } else {
        setProviders([]);
      }
    });
  }, [dispatch]);
  return {
    providers,
    provider,
  };
};

const SwapEntrypoint = () => {
  const { colors } = useTheme();
  const { replace } =
    useNavigation<
      StackNavigatorNavigation<SwapNavigatorParamList, ScreenName.Swap>
    >();
  const route =
    useRoute<StackNavigatorRoute<SwapNavigatorParamList, ScreenName.Swap>>();
  const swapKYC = useSelector(swapKYCSelector);
  const { provider, providers } = useProviders();
  useEffect(() => {
    if (!providers?.length || !provider) return;

    if (provider === "wyre" && swapKYC?.wyre?.status !== "approved") {
      replace(ScreenName.SwapKYC);
    } else {
      replace(ScreenName.SwapFormOrHistory, {
        screen: ScreenName.SwapForm,
        params: {
          providers,
          provider,
          defaultAccount: route?.params?.defaultAccount,
          defaultParentAccount: route?.params?.defaultParentAccount,
        },
        providers,
        provider,
        defaultAccount: route?.params?.defaultAccount,
        defaultParentAccount: route?.params?.defaultParentAccount,
      });
    }
  }, [replace, provider, providers, swapKYC, route?.params]);
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      {!providers ? (
        <View style={styles.loading}>
          <Spinning clockwise>
            <BigSpinner />
          </Spinning>
        </View>
      ) : !provider ? (
        <NotAvailable />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectDevice: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 20,
  },
  debugText: {
    marginBottom: 10,
  },
});
export default SwapEntrypoint;
