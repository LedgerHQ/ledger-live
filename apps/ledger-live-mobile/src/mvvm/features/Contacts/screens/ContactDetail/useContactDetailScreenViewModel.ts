import { useCallback, useLayoutEffect, useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  type AddAddressFlowState,
  type AddAddressEntryLabels,
  type AddAddressInputSource,
  type ContactsAddAddressEntryViewProps,
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
import { useContactsAddressValidationAdapter } from "../../hooks/useContactsAddressValidationAdapter";
import { useContactsCurrencySelectionAdapter } from "../../hooks/useContactsCurrencySelectionAdapter";

const MANUAL_ADDRESS_VALIDATION_DEBOUNCE_MS = 200;

type ContactDetailScreenViewModel =
  | Readonly<{ status: "redirecting" }>
  | Readonly<{
      status: "ready";
      addAddressFlowState: AddAddressFlowState;
      addAddressEntryProps: ContactsAddAddressEntryViewProps | null;
      onCloseAddAddress: () => void;
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
  const addressValidation = useContactsAddressValidationAdapter();
  const { selectCurrency } = useAddAddressCurrencySelectionViewModel({
    platform: "mobile",
    currencySelection,
  });
  const {
    state: addAddressFlowState,
    start: startAddAddress,
    completeCurrencySelection,
    updateAddress,
    close: closeAddAddress,
  } = useAddAddressFlowViewModel({
    addressValidation,
    manualValidationDebounceMs: MANUAL_ADDRESS_VALIDATION_DEBOUNCE_MS,
  });
  const onAddAddress = useCallback(() => {
    if (!contact) return;

    const contactId = contact.id;
    startAddAddress(contactId);
    void selectCurrency()
      .then(result => {
        if (result.status === "selected") {
          completeCurrencySelection(contactId, result.currencyId);
        } else if (result.status === "cancelled" || result.status === "unavailable") {
          closeAddAddress();
        }
      })
      .catch(closeAddAddress);
  }, [closeAddAddress, completeCurrencySelection, contact, selectCurrency, startAddAddress]);
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
  const addAddressEntryLabels = useMemo<AddAddressEntryLabels>(
    () => ({
      title: t("contacts.addAddressEntry.title"),
      addressPlaceholder: t("contacts.addAddressEntry.addressPlaceholder"),
      confirmAddress: t("contacts.addAddressEntry.confirmAddress"),
      validatingAddress: t("contacts.addAddressEntry.validatingAddress"),
      validAddress: t("contacts.addAddressEntry.validAddress"),
      invalidAddress: t("contacts.addAddressEntry.invalidAddress"),
      domainNotFound: t("contacts.addAddressEntry.domainNotFound"),
      validationUnavailable: t("contacts.addAddressEntry.validationUnavailable"),
      ensDisclaimer: t("contacts.addAddressEntry.ensDisclaimer"),
    }),
    [t],
  );
  const addAddressEntryProps = useMemo<ContactsAddAddressEntryViewProps | null>(
    () =>
      addAddressFlowState.status === "enteringAddress"
        ? {
            addressEntry: addAddressFlowState.addressEntry,
            labels: addAddressEntryLabels,
            onChangeText: onAddressChange,
            onQrCodeClick,
          }
        : null,
    [addAddressEntryLabels, addAddressFlowState, onAddressChange, onQrCodeClick],
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
    addAddressEntryProps,
    onCloseAddAddress: closeAddAddress,
    pageProps: {
      contact,
      labels,
      meAvatarSrc: USER_AVATAR_URL,
      onAddAddress,
      onOpenLedgerWalletAddresses,
    },
  };
}
