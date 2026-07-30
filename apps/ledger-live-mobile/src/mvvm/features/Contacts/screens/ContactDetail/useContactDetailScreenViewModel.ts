import { useCallback, useLayoutEffect, useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  type AddAddressFlowState,
  type AddAddressInputSource,
  type ContactDetailLabels,
  type ContactDetailViewProps,
  resolveEligibleAddressCurrencyIds,
  useAddAddressFlowViewModel,
  useContactsFeature,
  useEmptyContactDetail,
} from "@features/flow-contacts";
import type { BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { USER_AVATAR_URL } from "LLM/components/UserAvatar/constants";
import type { MyWalletNavigatorStackParamList } from "LLM/features/MyWallet/types";
import { useContactsAddressValidationAdapter } from "../../hooks/useContactsAddressValidationAdapter";
import type { ContactsAddAddressFlowDrawerProps } from "./components/ContactsAddAddressFlowDrawer/types";

const MANUAL_ADDRESS_VALIDATION_DEBOUNCE_MS = 200;

type ContactDetailScreenViewModel =
  | Readonly<{ status: "redirecting" }>
  | Readonly<{
      status: "ready";
      addAddressFlowState: AddAddressFlowState;
      addAddressFlowProps: ContactsAddAddressFlowDrawerProps;
      pageProps: ContactDetailViewProps;
    }>;

type NavigationProp = BaseNavigationComposite<
  NativeStackNavigationProp<MyWalletNavigatorStackParamList>
>;

export function useContactDetailScreenViewModel(): ContactDetailScreenViewModel {
  const navigation = useNavigation<NavigationProp>();
  const route =
    useRoute<RouteProp<MyWalletNavigatorStackParamList, typeof ScreenName.MyWalletContactDetail>>();
  const { isEnabled, eligibleAddressFamilies } = useContactsFeature("mobile");
  const { t } = useTranslation();
  const contact = useEmptyContactDetail(route.params.contactId);
  const addressValidation = useContactsAddressValidationAdapter();
  const eligibleNetworkIds = useMemo(
    () => resolveEligibleAddressCurrencyIds(eligibleAddressFamilies),
    [eligibleAddressFamilies],
  );
  const {
    state: addAddressFlowState,
    start: startAddAddress,
    completeCurrencySelection,
    updateAddress,
    confirmAddress,
    continueFromName,
    continueFromReview,
    goBack: goBackAddAddress,
    close: closeAddAddress,
  } = useAddAddressFlowViewModel({
    addressValidation,
    manualValidationDebounceMs: MANUAL_ADDRESS_VALIDATION_DEBOUNCE_MS,
  });
  const onAddAddress = useCallback(() => {
    if (!contact || eligibleNetworkIds.length === 0) return;
    startAddAddress(contact.id);
  }, [contact, eligibleNetworkIds.length, startAddAddress]);
  const onCurrencySelected = useCallback<ContactsAddAddressFlowDrawerProps["onCurrencySelected"]>(
    currencyId => {
      if (addAddressFlowState.status === "selectingCurrency") {
        completeCurrencySelection(addAddressFlowState.selectedContactId, currencyId);
      }
    },
    [addAddressFlowState, completeCurrencySelection],
  );
  const onOpenLedgerWalletAddresses = useCallback(() => {
    navigation.navigate(NavigatorName.Accounts, {
      screen: ScreenName.CryptoAddresses,
      params: {
        sourceScreenName: ScreenName.MyWalletContactDetail,
      },
    });
  }, [navigation]);
  const onAddressChange = useCallback(
    (value: string, inputMethod: AddAddressInputSource) => {
      void updateAddress(value, inputMethod);
    },
    [updateAddress],
  );
  const onQrCodeClick = useCallback(() => {
    navigation.navigate(ScreenName.ScanRecipient, {
      onScanned: value => {
        void updateAddress(value, "qr_code");
      },
    });
  }, [navigation, updateAddress]);
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
    addAddressFlowProps: {
      state: addAddressFlowState,
      eligibleNetworkIds,
      onAddressChange,
      onAddressConfirm: confirmAddress,
      onBack: goBackAddAddress,
      onClose: closeAddAddress,
      onContinueFromName: continueFromName,
      onContinueFromReview: continueFromReview,
      onCurrencySelected,
      onQrCodeClick,
    },
    pageProps: {
      contact,
      labels,
      meAvatarSrc: USER_AVATAR_URL,
      onAddAddress,
      onOpenLedgerWalletAddresses,
    },
  };
}
