import { useCallback, useLayoutEffect, useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  type AddAddressFlowState,
  type ContactDetailLabels,
  type ContactDetailViewProps,
  useAddAddressCurrencySelectionViewModel,
  useAddAddressFlowViewModel,
  useContactsFeature,
  useEmptyContactDetail,
} from "@features/flow-contacts";
import type { BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { USER_AVATAR_URL } from "LLM/components/UserAvatar/constants";
import type { MyWalletNavigatorStackParamList } from "LLM/features/MyWallet/types";
import { useContactsCurrencySelectionAdapter } from "../../hooks/useContactsCurrencySelectionAdapter";

type ContactDetailScreenViewModel =
  | Readonly<{ status: "redirecting" }>
  | Readonly<{
      status: "ready";
      addAddressFlowState: AddAddressFlowState;
      pageProps: ContactDetailViewProps;
    }>;

type NavigationProp = BaseNavigationComposite<
  NativeStackNavigationProp<MyWalletNavigatorStackParamList>
>;

export function useContactDetailScreenViewModel(): ContactDetailScreenViewModel {
  const navigation = useNavigation<NavigationProp>();
  const route =
    useRoute<RouteProp<MyWalletNavigatorStackParamList, typeof ScreenName.MyWalletContactDetail>>();
  const { isEnabled } = useContactsFeature("mobile");
  const { t } = useTranslation();
  const contact = useEmptyContactDetail(route.params.contactId);
  const currencySelection = useContactsCurrencySelectionAdapter();
  const { selectCurrency } = useAddAddressCurrencySelectionViewModel({
    platform: "mobile",
    currencySelection,
  });
  const {
    state: addAddressFlowState,
    start: startAddAddress,
    completeCurrencySelection,
    close: closeAddAddress,
  } = useAddAddressFlowViewModel();
  const onAddAddress = useCallback(() => {
    if (!contact) return;

    const contactId = contact.id;
    startAddAddress(contactId);
    void selectCurrency().then(result => {
      if (result.status === "selected") {
        completeCurrencySelection(contactId, result.currencyId);
      } else if (result.status === "cancelled" || result.status === "unavailable") {
        closeAddAddress();
      }
    });
  }, [closeAddAddress, completeCurrencySelection, contact, selectCurrency, startAddAddress]);
  const onOpenLedgerWalletAddresses = useCallback(() => {
    navigation.navigate(NavigatorName.Accounts, {
      screen: ScreenName.CryptoAddresses,
      params: {
        sourceScreenName: ScreenName.MyWalletContactDetail,
      },
    });
  }, [navigation]);
  const labels = useMemo<ContactDetailLabels>(
    () => ({
      addAddress: t("contacts.addAddress"),
      addYourAddress: t("contacts.addYourAddress"),
      emptyMeTitle: t("contacts.detail.emptyState.meTitle"),
      emptyContactTitle: () => t("contacts.detail.emptyState.title"),
      emptyMeDescription: t("contacts.detail.emptyState.meDescription"),
      emptyContactDescription: name => t("contacts.detail.emptyState.contactDescription", { name }),
      ledgerWalletAddresses: t("contacts.detail.ledgerWalletAddresses"),
      myAddresses: t("contacts.detail.myAddresses"),
      formatAddressCount: count => t("contacts.addressCount", { count }),
    }),
    [t],
  );
  const shouldRedirect = !isEnabled || !contact;

  useLayoutEffect(() => {
    if (shouldRedirect) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace(ScreenName.MyWallet);
      }
    }
  }, [navigation, shouldRedirect]);

  if (shouldRedirect) {
    return { status: "redirecting" };
  }

  return {
    status: "ready",
    addAddressFlowState,
    pageProps: {
      contact,
      labels,
      meAvatarSrc: USER_AVATAR_URL,
      onAddAddress,
      onOpenLedgerWalletAddresses,
    },
  };
}
