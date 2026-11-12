import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import Share from "react-native-share";
import { copyToClipboard } from "@shared/clipboard";
import {
  StackActions,
  useNavigation,
  useRoute,
  type ParamListBase,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TokenCurrency } from "@domain/entity-currency-token";
import perFamilyReceiveActivateAsset from "~/generated/ReceiveActivateAsset";
import {
  resolveReceiveBlock,
  toReceiveAddressData,
  useAccountReceive,
  type ReceiveAddressOptionId,
  type ReceiveAddressProps,
  type ReceiveHelpArticleId,
} from "@features/flow-receive";
import { useCurrencyById } from "@features/platform-currencies";
import {
  markReceiveVerifyHintSeen,
  selectHasSeenReceiveVerifyHint,
} from "@features/flow-receive/state";
import { useFeature, useFeatureFlags } from "@features/platform-feature-flags";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { leaveAppFor } from "LLM/features/AppLock/adapters/appVisibility";
import { useVerifyAddressFlow } from "LLM/features/Receive/verifyAddressIntent/useVerifyAddressFlow";
import type { VerifyAddressExecutorLWMProps } from "LLM/features/Receive/verifyAddressIntent/VerifyAddressExecutorLWM";
import type { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { useDispatch, useSelector } from "~/context/hooks";
import { ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { accountsSelector } from "~/reducers/accounts";
import { getReceiveFamilyConfig } from "../../utils/getReceiveFamilyConfig";
import { networkCurrencyOf, selectAccountEntry } from "../../utils/receiveAccount";
import { acceptedDeviceModelIdsExcluding } from "@features/platform-device-intent";
import { useReceiveAddressChecks } from "./useReceiveAddressChecks";
import { useAssetActivation } from "./useAssetActivation";

type ReceiveActivateAsset = (
  navigation: NativeStackNavigationProp<ParamListBase>,
  accountId: string,
  token?: TokenCurrency,
) => void;

export type ReceiveAddressScreenViewProps = Readonly<{
  receiveAddress?: ReceiveAddressProps;
  verifyDevice?: VerifyAddressExecutorLWMProps;
}>;

export function useReceiveAddressScreenViewModel(): ReceiveAddressScreenViewProps {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ReceiveFundsStackParamList, ScreenName.ReceiveAddress>>();
  const { accountUUID, assetId, legacyParams } = route.params;
  const flag = useFeature("newReceiveFlow");
  const featureFlags = useFeatureFlags();
  const hasSeenVerifyHint = useSelector(selectHasSeenReceiveVerifyHint);

  const { goBack, getParent } = navigation;
  const close = useCallback(() => (getParent() ?? { goBack }).goBack(), [getParent, goBack]);
  const { start, deviceIntent } = useVerifyAddressFlow();

  const entry = useSelector(state => selectAccountEntry(state, accountUUID));
  const descriptor = entry?.descriptor;
  const network = useMemo(() => descriptor && networkCurrencyOf(descriptor), [descriptor]);
  const { currency: assetCurrency } = useCurrencyById(assetId);
  const tokenCurrency = assetCurrency?.type === "TokenCurrency" ? assetCurrency : undefined;
  const { receive, gate, pending, error, refresh, refreshAssetStatus, isAssetStatusPending } =
    useAccountReceive(descriptor, assetId);
  const readyReceive = gate === null ? receive : undefined;

  // The legacy confirmation screen still handles onboarding, token activation and a failed read.
  const onUseLegacyFlow = useCallback(
    () => navigation.dispatch(StackActions.replace(ScreenName.ReceiveConfirmation, legacyParams)),
    [navigation, legacyParams],
  );

  // Legacy account no entity replaces yet: family notices, activation flows, the device call.
  const legacyAccount = useSelector(state =>
    entry?.legacyId
      ? accountsSelector(state).find(account => account.id === entry.legacyId)
      : undefined,
  );

  const family = useMemo(
    () =>
      descriptor && network
        ? getReceiveFamilyConfig({
            family: network.family,
            descriptor,
            asset: assetCurrency ?? network,
            featureFlags,
            legacyAccount,
            excludedFamilies: flag?.params?.excludedFamilies,
            receive,
            gate,
          })
        : undefined,
    [descriptor, network, assetCurrency, featureFlags, legacyAccount, flag, receive, gate],
  );
  const data = useMemo(
    () =>
      network
        ? toReceiveAddressData({
            asset: assetCurrency ?? network,
            network,
            address: readyReceive?.address ?? "",
          })
        : undefined,
    [network, assetCurrency, readyReceive],
  );
  const checks = useReceiveAddressChecks(network, data?.asset.ticker, readyReceive?.address);
  const acceptedDeviceModelIds = useMemo(
    () => acceptedDeviceModelIdsExcluding(family?.unsupportedDeviceModelIds),
    [family?.unsupportedDeviceModelIds],
  );

  // The family's own flow activates the token; coming back to this screen reads its status again.
  const activation = useAssetActivation(navigation, refreshAssetStatus);
  const activateAsset = network
    ? (perFamilyReceiveActivateAsset as Record<string, ReceiveActivateAsset | undefined>)[
        network.family
      ]
    : undefined;
  const legacyId = entry?.legacyId;
  const onActivateAsset = useMemo(
    () =>
      activateAsset && legacyId && tokenCurrency
        ? () => {
            activation.run(() =>
              activateAsset(
                navigation as unknown as NativeStackNavigationProp<ParamListBase>,
                legacyId,
                tokenCurrency,
              ),
            );
          }
        : undefined,
    [activateAsset, legacyId, tokenCurrency, navigation, activation],
  );

  const block = resolveReceiveBlock({
    receive,
    gate,
    pending,
    error,
    isAssetStatusPending,
    hasReturnedFromActivation: activation.hasReturned,
    isSanctioned: checks.isSanctioned,
  });
  const { blockedReason } = block;
  const isLoadingAddress = block.isLoadingAddress || (!blockedReason && !assetCurrency);

  const receiveFromExchangeUrl = useLocalizedUrl(urls.withdrawCrypto);
  const receiveSecurelyUrl = useLocalizedUrl(urls.receiveSecurely);
  const memoTagUrl = useLocalizedUrl(urls.memoTag);

  const onShare = useCallback(
    (address: string) =>
      void leaveAppFor(() => Share.open({ message: address, failOnCancel: false })),
    [],
  );

  const onVerify = useCallback(
    (_address: string, addressOptionId?: ReceiveAddressOptionId) => {
      const verification = readyReceive?.verification;
      // Only the address the device derives is verified: the shielded one is not, yet.
      if (!legacyAccount || !network) return;
      if (addressOptionId === "shielded" || verification?.type !== "address") return;
      dispatch(markReceiveVerifyHintSeen());
      start(
        { account: legacyAccount, verification, network, tokenCurrency },
        // A mismatching address must not stay on screen.
        { onDone: outcome => outcome === "mismatch" && close() },
      );
    },
    [readyReceive, legacyAccount, network, dispatch, tokenCurrency, start, close],
  );

  const onOpenHelpArticle = useCallback(
    (id: ReceiveHelpArticleId) =>
      Linking.openURL(id === "receiveFromExchange" ? receiveFromExchangeUrl : receiveSecurelyUrl),
    [receiveFromExchangeUrl, receiveSecurelyUrl],
  );

  const receiveAddress = useMemo<ReceiveAddressProps | undefined>(
    () =>
      data && family
        ? {
            ...data,
            isLoadingAddress,
            isCheckingAddress: checks.isCheckingAddress,
            blockedReason,
            onRetry: () => void refresh(),
            onUseLegacyFlow,
            onActivateAsset,
            serviceIncidents: checks.serviceIncidents,
            family,
            visibleActions: ["share", "copy", "verify"],
            verifyHint: hasSeenVerifyHint
              ? undefined
              : { open: true, onGotIt: () => dispatch(markReceiveVerifyHintSeen()) },
            onCopy: copyToClipboard,
            onShare,
            onVerify,
            onOpenHelpArticle,
            onLearnMoreMemoTag: () => Linking.openURL(memoTagUrl),
            onClose: close,
          }
        : undefined,
    [
      data,
      isLoadingAddress,
      checks,
      blockedReason,
      refresh,
      onUseLegacyFlow,
      onActivateAsset,
      family,
      hasSeenVerifyHint,
      dispatch,
      onShare,
      onVerify,
      onOpenHelpArticle,
      memoTagUrl,
      close,
    ],
  );

  return {
    receiveAddress,
    verifyDevice: deviceIntent.selection
      ? {
          ...deviceIntent.selection,
          onReady: deviceIntent.onReady,
          onExit: deviceIntent.onExit,
          acceptedDeviceModelIds,
        }
      : undefined,
  };
}
