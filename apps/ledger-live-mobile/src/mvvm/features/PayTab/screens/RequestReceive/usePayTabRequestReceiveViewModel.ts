import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import type { View } from "react-native";
import Share from "react-native-share";
import { captureRef } from "react-native-view-shot";
import Clipboard from "@react-native-clipboard/clipboard";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { PayRequestTrackEvent, RequestReceiveProps } from "@features/flow-pay-request";
import {
  markReceiveVerifyHintSeen,
  selectHasSeenReceiveVerifyHint,
} from "@features/flow-pay-request/state";
import { useTranslation } from "@shared/i18n";
import { useHideTabBar } from "LLM/hooks/useTabBarVisibility";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { deriveRequestReceiveData } from "LLM/features/PayTab/hooks/deriveRequestReceiveData";
import { usePayTabVerifyAddress } from "LLM/features/PayTab/hooks/usePayTabVerifyAddress";
import type { PayTabNavigatorParamList } from "../../types";
import { useDispatch, useSelector } from "~/context/hooks";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import type { PayTabRequestReceiveViewProps } from "./PayTabRequestReceiveView";

const REQUEST_PAGE = "Pay";
const VERIFY_HINT = "verify";

const onTrackEvent: PayRequestTrackEvent = (event, params) => {
  void track(event, params);
};

export function usePayTabRequestReceiveViewModel(): PayTabRequestReceiveViewProps {
  useHideTabBar();

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasSeenReceiveVerifyHint = useSelector(selectHasSeenReceiveVerifyHint);
  const { goBack, addListener, setOptions } =
    useNavigation<NativeStackNavigationProp<PayTabNavigatorParamList>>();
  const [hasNavigationSettled, setHasNavigationSettled] = useState(false);
  const route = useRoute<RouteProp<PayTabNavigatorParamList, ScreenName.PayTabRequestReceive>>();
  const { account } = useAccountScreen(route);
  const currency = route.params.currency;
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const { openIntro, verifyAddress, dieActive, onReady, onExit } = usePayTabVerifyAddress(
    onTrackEvent,
    goBack,
  );

  const data = useMemo(
    () => (account?.type === "Account" ? deriveRequestReceiveData(account, currency) : undefined),
    [account, currency],
  );
  const mainAccount = account?.type === "Account" ? account : undefined;
  const tokenCurrency = currency.type === "TokenCurrency" ? currency : undefined;

  const onCopy = useCallback((address: string) => {
    Clipboard.setString(address);
  }, []);

  const onShare = useCallback(async (address: string) => {
    try {
      const imageUrl = await captureRef(cardRef, { format: "png" });
      await Share.open({ url: imageUrl, message: address, failOnCancel: false });
    } catch {
      // TODO: handle share/capture errors
    }
  }, []);

  const markHintSeen = useCallback(() => {
    dispatch(markReceiveVerifyHintSeen());
  }, [dispatch]);

  useEffect(() => {
    // iOS edge-swipe would pop past the hint.
    setOptions({ gestureEnabled: hasSeenReceiveVerifyHint });
  }, [hasSeenReceiveVerifyHint, setOptions]);

  useEffect(() => {
    if (hasSeenReceiveVerifyHint) return;
    // Header and Android back would pop past the hint.
    const unsubBack = addListener("beforeRemove", event => {
      event.preventDefault();
    });
    // Open after enter transition. transitionStart fires before this screen mounts.
    const unsubEnd = addListener("transitionEnd", event => {
      if (!event.data.closing) setHasNavigationSettled(true);
    });
    return () => {
      unsubBack();
      unsubEnd();
    };
  }, [addListener, hasSeenReceiveVerifyHint]);

  const onHintShown = useCallback(() => {
    track("hint_impression", {
      hint: VERIFY_HINT,
      buttonLocation: "request",
      page: REQUEST_PAGE,
    });
  }, []);

  const onGotIt = useCallback(() => {
    track("button_clicked", {
      button: "got it",
      hint: VERIFY_HINT,
      buttonLocation: "request",
      page: REQUEST_PAGE,
    });
    markHintSeen();
  }, [markHintSeen]);

  const onVerify = useCallback(() => {
    if (!account) return;
    markHintSeen();
    openIntro();
  }, [account, markHintSeen, openIntro]);

  const labels = useMemo(
    () => ({
      title: t("payTab.request.title", { asset: data?.asset.name ?? "" }),
      networkLabel: t("payTab.request.networkLabel", { network: data?.network ?? "" }),
      actions: {
        share: t("payTab.request.actions.share"),
        copy: t("payTab.request.actions.copy"),
        copied: t("payTab.request.actions.copied"),
        save: t("payTab.request.actions.save"),
        verify: t("payTab.request.actions.verify"),
      },
    }),
    [t, data],
  );

  const requestReceive = useMemo<RequestReceiveProps>(
    () => ({
      isOpen: true,
      address: data?.address ?? "",
      asset: data?.asset ?? { name: "", ticker: "" },
      network: data?.network ?? "",
      page: REQUEST_PAGE,
      labels,
      assetIcon: data?.assetIcon ?? { ledgerId: "", ticker: "" },
      networkIcon: data?.networkIcon,
      cardRef,
      visibleActions: ["share", "copy", "verify"],
      onShare,
      onCopy,
      onVerify,
      onClose: goBack,
      onTrackEvent,
      verifyHint: hasSeenReceiveVerifyHint
        ? undefined
        : {
            open: hasNavigationSettled,
            message: t("payTab.request.verifyHint.message"),
            gotItLabel: t("payTab.request.verifyHint.gotIt"),
            onGotIt,
            onShown: onHintShown,
          },
    }),
    [
      data,
      labels,
      onShare,
      onCopy,
      onVerify,
      goBack,
      hasSeenReceiveVerifyHint,
      hasNavigationSettled,
      t,
      onGotIt,
      onHintShown,
    ],
  );

  return {
    requestReceive,
    verifyAddress,
    verifyDevice:
      dieActive && mainAccount
        ? {
            mainAccount,
            tokenCurrency,
            page: verifyAddress.page,
            onReady,
            onExit,
            onTrackEvent,
          }
        : undefined,
  };
}
