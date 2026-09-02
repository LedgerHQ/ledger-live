import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { v4 as uuid } from "uuid";
import { addAddress, contactAddress } from "@domain/entity-contact";
import {
  type ContactAddressDetailDialogNativeLabels,
  type ContactAddressDetailDialogNativeProps,
  type ContactDetailLabels,
  type ContactDetailViewProps,
  useContactDetailSharedState,
  useContactAddressDetailDialog,
  useContactsLedgerSyncMutationGuard,
  useEmptyContactDetail,
  usePopulatedContactDetail,
  CONTACTS_EVENT_SOURCE,
  CONTACTS_FLOW,
  CONTACTS_PAGE_EVENTS,
  CONTACTS_PAGE_PROPERTY,
  CONTACTS_TRACK_EVENTS,
  CONTACTS_TRACKING_BUTTON,
  trackContactsAddAddressClick,
} from "@features/flow-contacts";
import {
  isContactsLedgerSyncActivationRequired,
  type ContactsLedgerSyncIntroduction,
} from "@features/flow-contacts-introduction";
import {
  useAddAddressFlowViewModel,
  type AddAddressFlowState,
  type AddAddressInputSource,
} from "@features/flow-contacts-add-address";
import { getMinVersion } from "@ledgerhq/live-common/apps/support";
import {
  resolveEligibleAddressCurrencyIds,
  useContactsFeature,
  useContactsMeContact,
} from "@features/platform-contacts";
import {
  useContactsIntentsOrchestrator,
  type ContactsDeviceIntentExecutorProps,
} from "@features/platform-contacts/device";
import { contactsIntentLWMDefinitions } from "../../deviceIntents/contactsIntentPlatformDefinitions";
import {
  resolveContactsCurrencyAnalytics,
  useContactsAnalytics,
  contactsCurrencyAnalyticsDependencies,
} from "../../analytics";
import type { BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";
import { NavigatorName, ScreenName } from "~/const";
import { useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { USER_AVATAR_URL } from "LLM/components/UserAvatar/constants";
import type { MyWalletNavigatorStackParamList } from "LLM/features/MyWallet/types";
import { useContactsAddressValidationAdapter } from "../../hooks/useContactsAddressValidationAdapter";
import { useContactsLedgerSyncStatus } from "../../hooks/useContactsLedgerSyncStatus";
import { useContactsLedgerSyncActivationDrawer } from "../../hooks/useContactsLedgerSyncActivationDrawer";
import type { ContactsLedgerSyncActivationDrawerProps } from "../../components/ContactsLedgerSyncActivationDrawer";
import type { ContactsAddAddressFlowDrawerProps } from "./components/ContactsAddAddressFlowDrawer/types";
import type { ContactDetailEditDeleteFlowProps } from "./hooks/useContactDetailEditDeleteAdapter";
import { useContactDetailEditDeleteAdapter } from "./hooks/useContactDetailEditDeleteAdapter";
import { useContactAddressDetailActionsAdapter } from "../../hooks/useContactAddressDetailActionsAdapter";

const MANUAL_ADDRESS_VALIDATION_DEBOUNCE_MS = 200;

type ContactDetailScreenViewModel =
  | Readonly<{ status: "redirecting" }>
  | Readonly<{
      status: "ready";
      addAddressFlowState: AddAddressFlowState;
      addAddressFlowProps: ContactsAddAddressFlowDrawerProps;
      pageProps: ContactDetailViewProps;
      addressDetailDialog: ContactAddressDetailDialogNativeProps;
      isAddressDetailActionSheetOpen: boolean;
      addressDetailActions: ReturnType<typeof useContactAddressDetailActionsAdapter>;
      editDeleteFlow: ContactDetailEditDeleteFlowProps;
      ledgerSyncIntroduction: ContactsLedgerSyncIntroduction;
      ledgerSyncActivationDrawer: ContactsLedgerSyncActivationDrawerProps;
      dieProps: ContactsDeviceIntentExecutorProps | undefined;
    }>;

type NavigationProp = BaseNavigationComposite<
  NativeStackNavigationProp<MyWalletNavigatorStackParamList>
>;

export function useContactDetailScreenViewModel(): ContactDetailScreenViewModel {
  const dispatch = useDispatch();
  const hasCompletedConfirmation = useRef(false);
  const trackedContactDetailId = useRef<string | undefined>(undefined);
  const trackedAddressDetailId = useRef<string | undefined>(undefined);
  const analytics = useContactsAnalytics();
  const meContact = useContactsMeContact();
  const navigation = useNavigation<NavigationProp>();
  const route =
    useRoute<RouteProp<MyWalletNavigatorStackParamList, typeof ScreenName.MyWalletContactDetail>>();
  const { isEnabled, eligibleAddressFamilies } = useContactsFeature("mobile");
  const ledgerSyncStatus = useContactsLedgerSyncStatus();
  const { requestMutation, dismissPendingIntent } = useContactsLedgerSyncMutationGuard();
  const { ledgerSyncActivationDrawer, openLedgerSyncActivationDrawer } =
    useContactsLedgerSyncActivationDrawer();
  const [isLedgerSyncIntroductionOpen, setIsLedgerSyncIntroductionOpen] = useState(false);
  const { t } = useTranslation();
  const { deviceIntents, dieProps } = useContactsIntentsOrchestrator({
    intents: contactsIntentLWMDefinitions,
    getLiveConfigMinVersion: getMinVersion,
  });
  const emptyContact = useEmptyContactDetail(route.params.contactId);
  const populatedContactDetail = usePopulatedContactDetail(route.params.contactId);
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
    goBack: goBackAddAddress,
    close: closeAddAddress,
  } = useAddAddressFlowViewModel({
    addressValidation,
    manualValidationDebounceMs: MANUAL_ADDRESS_VALIDATION_DEBOUNCE_MS,
  });
  const completeAddressConfirmation = useCallback(async () => {
    if (addAddressFlowState.status !== "confirmationRequired") {
      hasCompletedConfirmation.current = false;
      return;
    }

    if (hasCompletedConfirmation.current) {
      return;
    }

    if (contact === undefined) {
      return;
    }

    hasCompletedConfirmation.current = true;

    /**
     * The Device Intent Executor owns the review from here, so this flow has nothing left
     * to show. `addAddressFlowState` below is this render's snapshot, unaffected by closing.
     */
    closeAddAddress();

    try {
      const signedAddress = await deviceIntents.registerExternalAddress({
        contact,
        currencyId: addAddressFlowState.selectedCurrencyId,
        label: addAddressFlowState.addressLabel.label,
        address: addAddressFlowState.addressEntry.resolvedAddress,
      });
      const address = contactAddress({
        id: `address-${uuid()}`,
        currencyId: addAddressFlowState.selectedCurrencyId,
        label: addAddressFlowState.addressLabel.label,
        address: addAddressFlowState.addressEntry.resolvedAddress,
        device: signedAddress.addressDeviceContext,
      });

      dispatch(
        addAddress({
          contactId: addAddressFlowState.selectedContactId,
          address,
          deviceCredentials: signedAddress.deviceCredentials,
        }),
      );

      try {
        const { network, asset } = await resolveContactsCurrencyAnalytics(
          addAddressFlowState.selectedCurrencyId,
          contactsCurrencyAnalyticsDependencies,
        );
        const inputMethod = addAddressFlowState.addressEntry.inputMethod ?? "manual";

        analytics.trackEvent(CONTACTS_TRACK_EVENTS.ADDRESS_ADDED, {
          source: CONTACTS_EVENT_SOURCE.ADD_ADDRESS,
          network,
          asset,
          inputMethod,
          isEns: inputMethod === "ens",
          flow: CONTACTS_FLOW.CONTACTS,
        });
      } catch {
        // Analytics enrichment is best-effort and must not affect the user flow.
      }
    } catch (error) {
      hasCompletedConfirmation.current = false;
      console.warn("Failed to complete add-address confirmation", error);
    }
  }, [addAddressFlowState, analytics, closeAddAddress, contact, deviceIntents, dispatch]);
  useEffect(() => {
    void completeAddressConfirmation();
  }, [completeAddressConfirmation]);
  const startAddAddressForContact = useCallback(() => {
    if (!contact || eligibleNetworkIds.length === 0) return;

    trackContactsAddAddressClick(analytics, contact.id, meContact.id);
    startAddAddress(contact);
  }, [analytics, contact, eligibleNetworkIds.length, meContact.id, startAddAddress]);
  const onAddAddress = useCallback(() => {
    if (!contact || eligibleNetworkIds.length === 0) return;

    const result = requestMutation({ kind: "addAddress", contactId: contact.id }, ledgerSyncStatus);
    if (result.status === "allowed") {
      startAddAddressForContact();
    } else if (result.status === "blocked") {
      setIsLedgerSyncIntroductionOpen(true);
    }
  }, [
    contact,
    eligibleNetworkIds.length,
    ledgerSyncStatus,
    requestMutation,
    startAddAddressForContact,
  ]);
  const onCurrencySelected = useCallback<ContactsAddAddressFlowDrawerProps["onCurrencySelected"]>(
    selection => {
      if (addAddressFlowState.status === "selectingCurrency") {
        completeCurrencySelection(addAddressFlowState.selectedContactId, selection);
      }
    },
    [addAddressFlowState, completeCurrencySelection],
  );
  const onLedgerWalletAccountsPress = useCallback(() => {
    navigation.navigate(NavigatorName.Accounts, {
      screen: ScreenName.CryptoAddresses,
      params: {
        sourceScreenName: ScreenName.MyWalletContactDetail,
      },
    });
  }, [navigation]);
  const onActivateLedgerSync = useCallback(() => {
    dismissPendingIntent();
    setIsLedgerSyncIntroductionOpen(false);
    openLedgerSyncActivationDrawer();
  }, [dismissPendingIntent, openLedgerSyncActivationDrawer]);
  const onDismissLedgerSyncIntroduction = useCallback(() => {
    dismissPendingIntent();
    setIsLedgerSyncIntroductionOpen(false);
  }, [dismissPendingIntent]);
  useEffect(() => {
    if (!isContactsLedgerSyncActivationRequired(ledgerSyncStatus)) {
      dismissPendingIntent();
      setIsLedgerSyncIntroductionOpen(false);
    }
  }, [dismissPendingIntent, ledgerSyncStatus]);
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
  const onContinueFromName = useCallback(() => {
    if (addAddressFlowState.status === "namingAddress") {
      const currencyId = addAddressFlowState.selectedCurrencyId;
      const inputMethod = addAddressFlowState.addressEntry.inputMethod ?? "manual";

      void resolveContactsCurrencyAnalytics(currencyId, contactsCurrencyAnalyticsDependencies)
        .then(({ network, asset }) => {
          analytics.trackEvent(CONTACTS_TRACK_EVENTS.BUTTON_CLICKED, {
            source: CONTACTS_EVENT_SOURCE.ADD_ADDRESS,
            button: CONTACTS_TRACKING_BUTTON.saveAddress,
            page: CONTACTS_PAGE_PROPERTY.CONTACT_DETAIL,
            network,
            asset,
            inputMethod,
            flow: CONTACTS_FLOW.CONTACTS,
          });
        })
        .catch(() => {
          // Analytics enrichment is best-effort and must not affect the user flow.
        });
    }

    continueFromName();
  }, [addAddressFlowState, analytics, continueFromName]);
  const labels = useMemo<ContactDetailLabels>(
    () => ({
      addAddress: t("contacts.addAddress"),
      addYourAddress: t("contacts.addYourAddress"),
      emptyMeTitle: t("contacts.detail.emptyState.meTitle"),
      emptyContactTitle: name => t("contacts.detail.emptyState.contactTitle", { name }),
      emptyMeDescription: t("contacts.detail.emptyState.meDescription"),
      emptyContactDescription: name => t("contacts.detail.emptyState.contactDescription", { name }),
      ledgerWalletAddresses: t("contacts.detail.ledgerWalletAddresses"),
      myAddresses: t("contacts.detail.myAddresses"),
      formatMeDisplayName: name => t("contacts.detail.meDisplayName", { name }),
      formatAddressCount: count => t("contacts.addressCount", { count }),
    }),
    [t],
  );
  const detailSharedState = useContactDetailSharedState(
    route.params.contactId,
    labels.formatMeDisplayName,
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
  const onDeleteSuccess = useCallback(() => {
    navigation.navigate(ScreenName.MyWalletContacts);
  }, [navigation]);
  const addressDetailAsset = selection?.network?.networkTicker;
  const addressDetailNetwork = selection?.network?.networkName;
  const editDeleteFlow = useContactDetailEditDeleteAdapter(
    route.params.contactId,
    onDeleteSuccess,
    deviceIntents,
  );
  const addressDetailActions = useContactAddressDetailActionsAdapter(
    route.params.contactId,
    selection?.row?.addressId,
    onCloseAddressDetail,
    deviceIntents,
    addressDetailAsset,
    addressDetailNetwork,
  );
  const isAddressDetailActionSheetOpen =
    addressDetailActions.deleteSheet.isOpen ||
    addressDetailActions.renameSheet.isOpen ||
    addressDetailActions.signerMismatchSheet.isOpen;
  const onCloseAddressDetailSheet = useCallback(() => {
    if (isAddressDetailActionSheetOpen) {
      return;
    }

    onCloseAddressDetail();
  }, [isAddressDetailActionSheetOpen, onCloseAddressDetail]);
  const shouldRedirect = !isEnabled || !contact;

  useEffect(() => {
    if (shouldRedirect) {
      return;
    }

    const contactId = route.params.contactId;

    if (trackedContactDetailId.current === contactId) {
      return;
    }

    trackedContactDetailId.current = contactId;
    analytics.trackPage(CONTACTS_PAGE_EVENTS.CONTACT_DETAIL, {
      source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
      isSelf: contactId === meContact.id,
    });
  }, [analytics, meContact.id, route.params.contactId, shouldRedirect]);

  useEffect(() => {
    if (shouldRedirect) {
      return;
    }

    const addressKey =
      isOpen && selection ? `${selection.row.addressId}:${selection.network.networkId}` : undefined;

    if (addressKey === undefined || trackedAddressDetailId.current === addressKey) {
      return;
    }

    trackedAddressDetailId.current = addressKey;
    analytics.trackPage(CONTACTS_PAGE_EVENTS.ADDRESS_DETAIL, {
      source: CONTACTS_EVENT_SOURCE.ADDRESS_DETAIL,
      network: selection!.network.networkName,
      asset: selection!.network.networkTicker,
    });
  }, [analytics, isOpen, selection, shouldRedirect]);

  useEffect(() => {
    if (!isOpen) {
      trackedAddressDetailId.current = undefined;
    }
  }, [isOpen]);

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
    ledgerWalletAccountsIntent: detailSharedState?.ledgerWalletAccountsIntent,
    onLedgerWalletAccountsPress,
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
      onContinueFromName,
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
      onClose: onCloseAddressDetailSheet,
      ...addressDetailActions.addressDetailDialog,
    },
    isAddressDetailActionSheetOpen,
    addressDetailActions,
    editDeleteFlow,
    ledgerSyncIntroduction: {
      isOpen:
        isContactsLedgerSyncActivationRequired(ledgerSyncStatus) && isLedgerSyncIntroductionOpen,
      title: t("contacts.ledgerSyncIntroduction.title"),
      description: t("contacts.ledgerSyncIntroduction.description"),
      activateLabel: t("contacts.ledgerSyncIntroduction.activate"),
      dismissLabel: t("contacts.ledgerSyncIntroduction.dismiss"),
      onActivate: onActivateLedgerSync,
      onDismiss: onDismissLedgerSyncIntroduction,
    },
    ledgerSyncActivationDrawer,
    dieProps,
  };
}
