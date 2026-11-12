import { useCallback, useMemo, useRef, useState } from "react";
import { makeEmptyTokenAccount } from "@ledgerhq/live-common/account/index";
import type { AccountEntry } from "@domain/entity-account";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import { useFeature, useFeatureFlags } from "@features/platform-feature-flags";
import { useCurrencyById } from "@features/platform-currencies";
import {
  resolveReceiveBlock,
  resolveReceiveFamilyConfig,
  toReceiveAddressData,
  useAccountReceive,
  type ReceiveAddressOptionId,
  type ReceiveAddressProps,
  type ReceiveHelpArticleId,
} from "@features/flow-receive";
import {
  markReceiveVerifyHintSeen,
  selectHasSeenReceiveVerifyHint,
} from "@features/flow-receive/state";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useCopyToClipboard } from "LLD/hooks/useCopyToClipboard";
import { useLLDCoinFamily } from "~/renderer/families";
import { openURL } from "~/renderer/linking";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { closeReceiveAddressDialog } from "~/renderer/reducers/receiveFlow";
import { openModal } from "~/renderer/actions/modals";
import { modalsStateSelector } from "~/renderer/reducers/modals";
import { useAssetActivation } from "./useAssetActivation";
import {
  onboardingReceiveFlowSelector,
  setIsOnboardingReceiveFlow,
} from "~/renderer/reducers/onboarding";
import {
  useVerifyAddressFlow,
  type VerifyAddressDeviceIntent,
} from "LLD/features/Receive/verifyAddressIntent/useVerifyAddressFlow";
import { acceptedDeviceModelIdsExcluding } from "@features/platform-device-intent";
import { networkCurrencyOf } from "../../receiveAccount";
import { useReceiveAddressChecks } from "./useReceiveAddressChecks";

export type ReceiveAddressDialogViewModel = Readonly<{
  isAddressVisible: boolean;
  receiveAddress: ReceiveAddressProps;
  deviceIntent: VerifyAddressDeviceIntent;
  /** DMK model ids the verify intent accepts; empty means all. */
  acceptedDeviceModelIds: ReturnType<typeof acceptedDeviceModelIdsExcluding>;
}>;

/** The dialog's account and asset, resolved from the store by `ReceiveAddressDialogRoot`. */
export type ReceiveAddressDialogTarget = Readonly<{
  entry: AccountEntry;
  assetId: CryptoOrTokenCurrencyId;
  source?: string;
}>;

export function useReceiveAddressDialogViewModel({
  entry: { descriptor, legacyId },
  assetId,
}: ReceiveAddressDialogTarget): ReceiveAddressDialogViewModel {
  const dispatch = useDispatch();
  const flag = useFeature("newReceiveFlow");
  const featureFlags = useFeatureFlags();
  const hasSeenVerifyHint = useSelector(selectHasSeenReceiveVerifyHint);
  const copyToClipboard = useCopyToClipboard();
  const verify = useVerifyAddressFlow();
  const [isAddressVisible, setIsAddressVisible] = useState(true);

  const network = useMemo(() => networkCurrencyOf(descriptor), [descriptor]);
  const { currency: assetCurrency } = useCurrencyById(assetId);
  const asset = assetCurrency ?? network;
  const token = assetCurrency?.type === "TokenCurrency" ? assetCurrency : undefined;
  const { receive, gate, pending, error, refresh, refreshAssetStatus, isAssetStatusPending } =
    useAccountReceive(descriptor, assetId);
  const readyReceive = gate === null ? receive : undefined;

  // Legacy account no entity replaces yet: family notices, activation flows, the device call.
  const legacyAccount = useSelector(state =>
    legacyId ? accountsSelector(state).find(account => account.id === legacyId) : undefined,
  );
  const coinFamily = useLLDCoinFamily(network.family);

  const family = useMemo(
    () =>
      resolveReceiveFamilyConfig({
        family: network.family,
        familyConfig: coinFamily?.receiveAddressConfig?.({
          descriptor,
          asset,
          featureFlags,
          legacyAccount,
        }),
        excludedFamilies: flag?.params?.excludedFamilies,
        receive,
        gate,
      }),
    [
      network.family,
      coinFamily,
      descriptor,
      asset,
      featureFlags,
      legacyAccount,
      flag,
      receive,
      gate,
    ],
  );

  const data = useMemo(
    () => toReceiveAddressData({ asset, network, address: readyReceive?.address ?? "" }),
    [asset, network, readyReceive],
  );
  const checks = useReceiveAddressChecks(network, asset.ticker, readyReceive?.address);
  const acceptedDeviceModelIds = useMemo(
    () => acceptedDeviceModelIdsExcluding(family.unsupportedDeviceModelIds),
    [family.unsupportedDeviceModelIds],
  );

  const isAnyModalOpen = useSelector(state =>
    Object.values(modalsStateSelector(state)).some(modal => modal?.isOpened),
  );
  const activation = useAssetActivation({
    isAnyModalOpen,
    refresh: refreshAssetStatus,
    setIsAddressVisible,
  });

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

  const receiveFromExchangeUrl = useLocalizedUrl(urls.receiveFlow.receiveFromExchange);
  const receiveSecurelyUrl = useLocalizedUrl(urls.receiveFlow.receiveSecurely);
  const memoTagUrl = useLocalizedUrl(urls.memoTag.learnMore);

  const isOnboardingReceiveFlow = useSelector(onboardingReceiveFlowSelector);
  const isAddressVerifiedRef = useRef(false);
  const onClose = useCallback(() => {
    // Same hand-off as the legacy modal: the onboarding receive step succeeds once verified.
    if (isOnboardingReceiveFlow) {
      dispatch(
        setIsOnboardingReceiveFlow({ isFlow: false, isSuccess: isAddressVerifiedRef.current }),
      );
    }
    dispatch(closeReceiveAddressDialog());
  }, [dispatch, isOnboardingReceiveFlow]);

  // The legacy modal still handles onboarding, token activation and an unreadable account.
  const onUseLegacyFlow = useCallback(() => {
    if (!legacyAccount) return;
    const account =
      token &&
      (legacyAccount.subAccounts?.find(
        sub => sub.type === "TokenAccount" && sub.token.id === token.id,
      ) ??
        makeEmptyTokenAccount(legacyAccount, token));
    dispatch(closeReceiveAddressDialog());
    dispatch(
      openModal(
        "MODAL_RECEIVE",
        account ? { account, parentAccount: legacyAccount } : { account: legacyAccount },
      ),
    );
  }, [dispatch, legacyAccount, token]);

  // The family's own flow (association, opt-in, trustline) activates the token; the receive
  // dialog steps aside meanwhile and reads the token again once that flow is closed.
  const addAssetAction = coinFamily?.addAssetAction;
  const onActivateAsset = useMemo(
    () =>
      addAssetAction && legacyAccount && token
        ? () => activation.run(() => addAssetAction({ account: legacyAccount, dispatch, token }))
        : undefined,
    [addAssetAction, legacyAccount, token, activation, dispatch],
  );

  const onVerify = useCallback(
    (_address: string, addressOptionId?: ReceiveAddressOptionId) => {
      const verification = readyReceive?.verification;
      // Only the address the device derives is verified: the shielded one is not, yet.
      if (!legacyAccount) return;
      if (addressOptionId === "shielded" || verification?.type !== "address") return;
      dispatch(markReceiveVerifyHintSeen());
      verify.start(
        { account: legacyAccount, verification, network, token },
        {
          // One dialog at a time: the address steps aside once the device dialog is up.
          onReady: () => setIsAddressVisible(false),
          onDone: outcome => {
            if (outcome === "verified") isAddressVerifiedRef.current = true;
            // A mismatching address must not stay on screen.
            if (outcome === "mismatch") onClose();
            else setIsAddressVisible(true);
          },
        },
      );
    },
    [readyReceive, legacyAccount, dispatch, verify, network, token, onClose],
  );

  const onOpenHelpArticle = useCallback(
    (id: ReceiveHelpArticleId) =>
      openURL(id === "receiveFromExchange" ? receiveFromExchangeUrl : receiveSecurelyUrl),
    [receiveFromExchangeUrl, receiveSecurelyUrl],
  );

  const receiveAddress = useMemo<ReceiveAddressProps>(
    () => ({
      ...data,
      isLoadingAddress,
      isCheckingAddress: checks.isCheckingAddress,
      blockedReason,
      onRetry: () => void refresh(),
      onUseLegacyFlow: legacyAccount ? onUseLegacyFlow : undefined,
      onActivateAsset,
      serviceIncidents: checks.serviceIncidents,
      family,
      visibleActions: ["copy", "verify"],
      verifyHint: hasSeenVerifyHint
        ? undefined
        : { open: true, onGotIt: () => dispatch(markReceiveVerifyHintSeen()) },
      onCopy: copyToClipboard,
      onVerify,
      onOpenHelpArticle,
      onLearnMoreMemoTag: () => openURL(memoTagUrl),
      onClose,
    }),
    [
      data,
      isLoadingAddress,
      checks,
      blockedReason,
      refresh,
      legacyAccount,
      onUseLegacyFlow,
      onActivateAsset,
      family,
      hasSeenVerifyHint,
      dispatch,
      copyToClipboard,
      onVerify,
      onOpenHelpArticle,
      memoTagUrl,
      onClose,
    ],
  );

  return {
    isAddressVisible,
    receiveAddress,
    deviceIntent: verify.deviceIntent,
    acceptedDeviceModelIds,
  };
}
