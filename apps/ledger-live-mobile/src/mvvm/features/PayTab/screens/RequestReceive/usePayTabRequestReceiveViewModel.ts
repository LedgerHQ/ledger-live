import { useCallback, useEffect, useMemo } from "react";
import { Share } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RequestReceiveProps } from "@features/flow-pay-card-request";
import { useHideTabBar } from "LLM/hooks/useTabBarVisibility";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { deriveRequestReceiveData } from "LLM/features/PayTab/hooks/deriveRequestReceiveData";
import type { PayTabNavigatorParamList } from "../../types";
import { useTranslation } from "~/context/Locale";
import { ScreenName } from "~/const";
import { track } from "~/analytics";

const REQUEST_PAGE = "Pay";

export function usePayTabRequestReceiveViewModel(): RequestReceiveProps {
  useHideTabBar();

  const { t } = useTranslation();
  const { goBack } = useNavigation<NativeStackNavigationProp<PayTabNavigatorParamList>>();
  const route = useRoute<RouteProp<PayTabNavigatorParamList, ScreenName.PayTabRequestReceive>>();
  const { account, parentAccount } = useAccountScreen(route);

  useEffect(() => {
    if (!account) {
      goBack();
    }
  }, [account, goBack]);

  const data = useMemo(
    () => (account ? deriveRequestReceiveData(account, parentAccount ?? undefined) : undefined),
    [account, parentAccount],
  );

  const onClose = useCallback(() => {
    goBack();
  }, [goBack]);

  const onCopy = useCallback((address: string) => {
    Clipboard.setString(address);
  }, []);

  const onShare = useCallback((address: string) => {
    void Share.share({ message: address }).catch(() => undefined);
  }, []);

  const onTrackEvent = useCallback((event: string, properties: Record<string, unknown>) => {
    track(event, properties);
  }, []);

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

  return {
    isOpen: true,
    address: data?.address ?? "",
    asset: data?.asset ?? { name: "", ticker: "" },
    network: data?.network ?? "",
    page: REQUEST_PAGE,
    labels,
    assetIcon: data?.assetIcon ?? { ledgerId: "", ticker: "" },
    networkIcon: data?.networkIcon,
    visibleActions: ["share", "copy", "verify"],
    onShare,
    onCopy,
    onVerify: () => undefined,
    onClose,
    onTrackEvent,
  };
}
