import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { v4 as uuid } from "uuid";
import { addAddress, contactAddress } from "@domain/entity-contact";
import {
  type AddAddressFlowState,
  type AddAddressInputSource,
  type ContactAddressDetailDialogNativeLabels,
  type ContactAddressDetailDialogNativeProps,
  type ContactDetailLabels,
  type ContactDetailViewProps,
  resolveEligibleAddressCurrencyIds,
  useAddAddressFlowViewModel,
  useContactAddressDetailDialog,
  useContactsFeature,
  useEmptyContactDetail,
  usePopulatedContactDetail,
} from "@features/flow-contacts";
import type { BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { USER_AVATAR_URL } from "LLM/components/UserAvatar/constants";
import type { MyWalletNavigatorStackParamList } from "LLM/features/MyWallet/types";
import { useContactsAddressCurrencyAdapter } from "../../hooks/useContactsAddressCurrencyAdapter";
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
      addressDetailDialog: ContactAddressDetailDialogNativeProps;
    }>;

type NavigationProp = BaseNavigationComposite<
  NativeStackNavigationProp<MyWalletNavigatorStackParamList>
>;

export function useContactDetailScreenViewModel(): ContactDetailScreenViewModel {
  const dispatch = useDispatch();
  const hasCompletedMockConfirmation = useRef(false);
  const navigation = useNavigation<NavigationProp>();
  const route =
    useRoute<RouteProp<MyWalletNavigatorStackParamList, typeof ScreenName.MyWalletContactDetail>>();
  const { isEnabled, eligibleAddressFamilies } = useContactsFeature("mobile");
  const { t } = useTranslation();
  const currencyPort = useContactsAddressCurrencyAdapter();
  const emptyContact = useEmptyContactDetail(route.params.contactId);
  const populatedContactDetail = usePopulatedContactDetail(route.params.contactId, currencyPort);
  const {
    isOpen,
    selection,
    onAddressRowPress,
    onClose: onCloseAddressDetail,
  } = useContactAddressDetailDialog(populatedContactDetail);
  const contact = populatedContactDetail?.contact ?? emptyContact;
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
    updateAddressLabel,
    confirmAddress,
    continueFromName,
    completeMockConfirmation,
    goBack: goBackAddAddress,
    close: closeAddAddress,
  } = useAddAddressFlowViewModel({
    addressValidation,
    manualValidationDebounceMs: MANUAL_ADDRESS_VALIDATION_DEBOUNCE_MS,
  });
  const completeMockAddressConfirmation = useCallback(() => {
    if (addAddressFlowState.status !== "confirmationRequired") {
      hasCompletedMockConfirmation.current = false;
      return;
    }

    if (hasCompletedMockConfirmation.current) {
      return;
    }

    hasCompletedMockConfirmation.current = true;

    const address = contactAddress({
      id: `address-${uuid()}`,
      currencyId: addAddressFlowState.selectedCurrencyId,
      label: addAddressFlowState.addressLabel.label,
      address: addAddressFlowState.addressEntry.resolvedAddress,
    });

    dispatch(addAddress({ contactId: addAddressFlowState.selectedContactId, address }));
    completeMockConfirmation();
    closeAddAddress();
  }, [addAddressFlowState, closeAddAddress, completeMockConfirmation, dispatch]);
  useEffect(() => {
    completeMockAddressConfirmation();
  }, [completeMockAddressConfirmation]);
  const onAddAddress = useCallback(() => {
    if (!contact || eligibleNetworkIds.length === 0) return;
    startAddAddress(contact);
  }, [contact, eligibleNetworkIds.length, startAddAddress]);
  const onCurrencySelected = useCallback<ContactsAddAddressFlowDrawerProps["onCurrencySelected"]>(
    selection => {
      if (addAddressFlowState.status === "selectingCurrency") {
        completeCurrencySelection(addAddressFlowState.selectedContactId, selection);
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
  const onAddressNameChange = useCallback(
    (value: string) => {
      updateAddressLabel(value);
    },
    [updateAddressLabel],
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
  const addressDetailDialogLabels = useMemo<ContactAddressDetailDialogNativeLabels>(
    () => ({
      send: t("contacts.addressDetail.send"),
      copy: t("contacts.addressDetail.copy"),
      copyAddress: t("contacts.addressDetail.copyAddress"),
      copied: t("contacts.addressDetail.copied"),
      edit: t("contacts.addressDetail.edit"),
      share: t("contacts.addressDetail.share"),
      delete: t("contacts.addressDetail.delete"),
      formatNetworkTag: networkName =>
        t("contacts.addressDetail.networkTag", { name: networkName }),
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

  const pageProps: ContactDetailViewProps = {
    contact,
    labels,
    meAvatarSrc: USER_AVATAR_URL,
    onAddAddress,
    onOpenLedgerWalletAddresses,
    ...(populatedContactDetail
      ? {
          addressGroups: populatedContactDetail.addressGroups,
          onAddressRowPress,
        }
      : {}),
  };

  return {
    status: "ready",
    addAddressFlowState,
    addAddressFlowProps: {
      state: addAddressFlowState,
      eligibleNetworkIds,
      onAddressChange,
      onAddressNameChange,
      onAddressConfirm: confirmAddress,
      onBack: goBackAddAddress,
      onClose: closeAddAddress,
      onContinueFromName: continueFromName,
      onCurrencySelected,
      onQrCodeClick,
    },
    pageProps,
    addressDetailDialog: {
      isOpen,
      contactName: contact.name,
      row: selection?.row,
      network: selection?.network,
      labels: addressDetailDialogLabels,
      onClose: onCloseAddressDetail,
    },
  };
}
