import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { View } from "react-native";
import Share from "react-native-share";
import { captureRef } from "react-native-view-shot";
import Clipboard from "@react-native-clipboard/clipboard";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RequestReceiveProps } from "@features/flow-pay-request";
import { trackButtonClicked, trackEvent } from "@features/platform-pay-analytics";
import {
  markReceiveVerifyHintSeen,
  selectHasSeenReceiveVerifyHint,
} from "@features/flow-pay-request/state";
import { useHideTabBar } from "LLM/hooks/useTabBarVisibility";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { deriveRequestReceiveData } from "LLM/features/PayTab/hooks/deriveRequestReceiveData";
import { usePayTabVerifyAddress } from "LLM/features/PayTab/hooks/usePayTabVerifyAddress";
import type { PayTabNavigatorParamList } from "../../types";
import { useDispatch, useSelector } from "~/context/hooks";
import { ScreenName } from "~/const";
import type { PayTabRequestReceiveViewProps } from "./PayTabRequestReceiveView";

const REQUEST_PAGE = "Request complete";
const VERIFY_HINT = "verify";

export function usePayTabRequestReceiveViewModel(): PayTabRequestReceiveViewProps {
  useHideTabBar();

  const dispatch = useDispatch();
  const hasSeenReceiveVerifyHint = useSelector(selectHasSeenReceiveVerifyHint);
  const { goBack, addListener, setOptions } =
    useNavigation<NativeStackNavigationProp<PayTabNavigatorParamList>>();
  const [hasNavigationSettled, setHasNavigationSettled] = useState(false);
  const route = useRoute<RouteProp<PayTabNavigatorParamList, ScreenName.PayTabRequestReceive>>();
  const { account } = useAccountScreen(route);
  const currency = route.params.currency;
  const cardRef = useRef<View>(null);
  const { openIntro, verifyAddress, dieActive, onReady, onExit } = usePayTabVerifyAddress(goBack);

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
    trackEvent("hint_impression", {
      hint: VERIFY_HINT,
      buttonLocation: "request",
      page: REQUEST_PAGE,
      flow: "request",
    });
  }, []);

  const onGotIt = useCallback(() => {
    trackButtonClicked({
      button: "got it",
      hint: VERIFY_HINT,
      buttonLocation: "request",
      page: REQUEST_PAGE,
      flow: "request",
    });
    markHintSeen();
  }, [markHintSeen]);

  const onVerify = useCallback(() => {
    if (!account) return;
    markHintSeen();
    openIntro();
  }, [account, markHintSeen, openIntro]);

  const requestReceive = useMemo<RequestReceiveProps>(
    () => ({
      isOpen: true,
      address: data?.address ?? "",
      asset: data?.asset ?? { name: "", ticker: "" },
      network: data?.network ?? "",
      page: REQUEST_PAGE,
      assetIcon: data?.assetIcon ?? { ledgerId: "", ticker: "" },
      networkIcon: data?.networkIcon,
      cardRef,
      visibleActions: ["share", "copy", "verify"],
      onShare,
      onCopy,
      onVerify,
      onClose: goBack,
      verifyHint: hasSeenReceiveVerifyHint
        ? undefined
        : {
            open: hasNavigationSettled,
            onGotIt,
            onShown: onHintShown,
          },
    }),
    [
      data,
      onShare,
      onCopy,
      onVerify,
      goBack,
      hasSeenReceiveVerifyHint,
      hasNavigationSettled,
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
          }
        : undefined,
  };
}
