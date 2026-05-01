import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Linking, Platform, StyleSheet, View } from "react-native";
import SafeAreaView from "~/components/SafeAreaView";
import { useTheme } from "styled-components/native";
import { useFocusEffect } from "@react-navigation/native";
import { Flex, IconsLegacy, Text } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import {
  dismiss as dismissRequest,
  registerCloseHandler,
} from "@ledgerhq/live-common/wallet-api/LiveAppModal/registry";
import { buildLiveAppModalURL } from "@ledgerhq/live-common/wallet-api/LiveAppModal/url";
import { handlers as liveAppModalHandlers } from "@ledgerhq/live-common/wallet-api/LiveAppModal/server";
import { handlers as deeplinkHandlers } from "@ledgerhq/live-common/wallet-api/CustomDeeplink/server";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import {
  stakeProgramsToEarnParam,
  getEthDepositScreenSetting,
} from "@ledgerhq/live-common/featureFlags/stakePrograms/index";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import GenericErrorView from "~/components/GenericErrorView";
import InfiniteLoader from "~/components/InfiniteLoader";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
import { useDispatch, useSelector } from "~/context/hooks";
import { useSettings } from "~/hooks";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import {
  selectLiveAppModal,
  setLiveAppModal,
  type LiveAppModalParams,
} from "~/reducers/liveAppModal";
import { getCountryLocale } from "~/helpers/getStakeLabelLocaleBased";
import { useVersionedStakePrograms } from "LLM/hooks/useStake/useVersionedStakePrograms";
import { ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.LiveAppModal>;
type ExtraInputs = Record<string, string | undefined> | null;

const appManifestNotFoundError = new Error("App not found");

const EmptyLoader = () => <View />;

const LiveAppModalScreenContent = ({
  params,
  navigation,
  extraInputs,
}: {
  params: LiveAppModalParams;
  navigation: Props["navigation"];
  extraInputs: ExtraInputs;
}) => {
  const { requestId, manifestId, path, title, description } = params;
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { language } = useSettings();
  const { ticker: currencyTicker } = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const countryLocale = getCountryLocale();

  const manifest = useLiveAppManifest(manifestId);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);

  const handleClose = useCallback(() => {
    dispatch(setLiveAppModal(null));
    navigation.goBack();
  }, [dispatch, navigation]);

  useEffect(() => {
    registerCloseHandler(requestId, () => {
      dispatch(setLiveAppModal(null));
      navigation.goBack();
    });
  }, [requestId, dispatch, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (webviewState.canGoBack) {
          webviewAPIRef.current?.goBack();
          return true;
        }
        return false;
      });
      return () => subscription.remove();
    }, [webviewState.canGoBack]),
  );

  // The Earn middleware reads initialization state from the URL (theme, lang,
  // uiVersion, etc.) because getInitialURL passes goToURL through as-is
  // without merging our `inputs` prop.
  const goToURL = useMemo(() => {
    if (!manifest) return undefined;
    return buildLiveAppModalURL({
      manifestURL: manifest.url.toString(),
      path,
      requestId,
      inputs: {
        theme,
        lang: language,
        locale: language,
        countryLocale,
        currencyTicker,
        discreetMode: discreet ? "true" : "false",
        OS: Platform.OS,
        ...extraInputs,
      },
    });
  }, [
    manifest,
    path,
    requestId,
    theme,
    language,
    countryLocale,
    currencyTicker,
    discreet,
    extraInputs,
  ]);

  const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
    return {
      ...liveAppModalHandlers({
        uiHooks: {
          // nested opens from within a modal are rejected by the registry's depth guard,
          // but we still need to satisfy the handler contract
          "custom.liveApp.modal.open": () => {
            /* no-op: nested opens not supported */
          },
        },
      }),
      ...deeplinkHandlers({
        uiHooks: {
          "custom.deeplink.open": openParams => {
            if (openParams) Linking.openURL(openParams.url);
          },
        },
      }),
    };
  }, []);

  const inputs = useMemo<Record<string, string | undefined>>(
    () => ({
      theme,
      lang: language,
      locale: language,
      isLiveAppModal: "true",
      liveAppModalRequestId: requestId,
      goToURL,
    }),
    [theme, language, requestId, goToURL],
  );

  if (!manifest) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]} isFlex>
        <Flex flex={1} justifyContent="center" alignItems="center" p={10}>
          {remoteLiveAppState.isLoading ? (
            <InfiniteLoader />
          ) : (
            <GenericErrorView error={appManifestNotFoundError} />
          )}
        </Flex>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]} isFlex>
      <Flex px={6} pt={4} pb={6}>
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={8}
          accessibilityRole="button"
          style={styles.backButton}
        >
          <IconsLegacy.ArrowLeftMedium size={24} />
        </TouchableOpacity>
        {title ? (
          <Text variant="h3" fontWeight="semiBold" mt={4}>
            {title}
          </Text>
        ) : null}
        {description ? (
          <Text variant="body" color="neutral.c70" mt={2}>
            {description}
          </Text>
        ) : null}
      </Flex>
      <View style={styles.webviewContainer}>
        <Web3AppWebview
          ref={webviewAPIRef}
          manifest={manifest}
          inputs={inputs}
          onStateChange={setWebviewState}
          customHandlers={customHandlers}
          Loader={EmptyLoader}
        />
      </View>
    </SafeAreaView>
  );
};

const EarnLiveAppModalScreenContent = ({
  params,
  navigation,
}: {
  params: LiveAppModalParams;
  navigation: Props["navigation"];
}) => {
  const { isEnabled: isLwm40Enabled } = useWalletFeaturesConfig("mobile");
  const stakePrograms = useVersionedStakePrograms();
  const extraInputs = useMemo<ExtraInputs>(() => {
    const { stakeProgramsParam } = stakeProgramsToEarnParam(stakePrograms);
    const stakeCurrenciesParam = stakePrograms?.params?.list;
    const ethDepositCohort = getEthDepositScreenSetting(stakePrograms);
    return {
      uiVersion: isLwm40Enabled ? "v2" : "v1",
      lw40enabled: isLwm40Enabled ? "true" : "false",
      ethDepositCohort,
      stakeProgramsParam: stakeProgramsParam ? JSON.stringify(stakeProgramsParam) : undefined,
      stakeCurrenciesParam: stakeCurrenciesParam?.length
        ? JSON.stringify(stakeCurrenciesParam)
        : undefined,
    };
  }, [stakePrograms, isLwm40Enabled]);

  return (
    <LiveAppModalScreenContent params={params} navigation={navigation} extraInputs={extraInputs} />
  );
};

const LiveAppModalScreen = ({ navigation }: Props) => {
  const params = useSelector(selectLiveAppModal);
  const dispatch = useDispatch();
  const requestIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (params) requestIdRef.current = params.requestId;
  }, [params]);

  useEffect(() => {
    // Safety net: if the screen unmounts for any reason (system back,
    // swipe-to-dismiss, navigation reset), resolve the pending registry
    // entry so the live-app's RPC promise settles, and clear Redux state
    // so a later remount doesn't replay the previous modal.
    return () => {
      if (requestIdRef.current) {
        dismissRequest(requestIdRef.current);
      }
      dispatch(setLiveAppModal(null));
    };
  }, [dispatch]);

  if (!params) return null;

  if (params.useCase === "earn") {
    return <EarnLiveAppModalScreenContent params={params} navigation={navigation} />;
  }

  return <LiveAppModalScreenContent params={params} navigation={navigation} extraInputs={null} />;
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  webviewContainer: {
    flex: 1,
  },
  backButton: {
    width: 24,
    height: 24,
  },
});

export default LiveAppModalScreen;
