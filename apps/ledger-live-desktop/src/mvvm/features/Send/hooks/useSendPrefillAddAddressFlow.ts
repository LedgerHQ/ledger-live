import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuid } from "uuid";
import {
  addAddress,
  contactAddress,
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  type Contact,
} from "@domain/entity-contact";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { resolvePrefillAddAddressParams } from "@ledgerhq/live-common/flows/send/recipient/utils/resolvePrefillAddAddressParams";
import { getMinVersion } from "@ledgerhq/live-common/apps/support";
import {
  useContactsIntentsOrchestrator,
  type ContactsDeviceIntentExecutorProps,
} from "@features/platform-contacts/device";
import {
  isPrefillAddAddressFlowOpen,
  useAddAddressFlowViewModel,
  type AddAddressEntryLabels,
  type ContactsAddAddressNameLabels,
  type ContactsAddAddressReviewLabels,
  type PrefillAddAddressFlowVisibleState,
} from "@features/flow-contacts-add-address";
import { useContactsAddressValidationAdapter } from "LLD/features/Contacts/hooks/useContactsAddressValidationAdapter";
import { contactsIntentLWDDefinitions } from "LLD/features/Contacts/deviceIntents/contactsIntentPlatformDefinitions";
import { useDispatch } from "LLD/hooks/redux";
import { useFlowWizard } from "../../FlowWizard/FlowWizardContext";
import { useSendFlowData } from "../context/SendFlowContext";
import {
  DEFAULT_ADD_NEW_CONTACT_HEADER_STATE,
  useAddNewContactHeaderController,
  type AddNewContactHeaderState,
} from "../context/AddNewContactHeaderContext";

export type SendPrefillAddAddressPhase = Readonly<{
  state: PrefillAddAddressFlowVisibleState;
  entryLabels: AddAddressEntryLabels;
  nameLabels: ContactsAddAddressNameLabels;
  reviewLabels: ContactsAddAddressReviewLabels;
  dieProps: ContactsDeviceIntentExecutorProps | undefined;
  onAddressLabelChange: (value: string) => void;
  onContinueFromName: () => void;
  onContinueFromReview: () => void;
}>;

export type UseSendPrefillAddAddressFlowOptions = Readonly<{
  idleHeaderState: AddNewContactHeaderState;
}>;

export type SendPrefillAddAddressFlow = Readonly<{
  addressPhase: SendPrefillAddAddressPhase | null;
  isOpeningAddressFlow: boolean;
  startForContact: (contact: Contact) => Promise<void>;
}>;

const ADDRESS_PHASE_HEADER_STATE: AddNewContactHeaderState = {
  titleKey: "contacts.addAddressEntry.title",
  onAddressPhaseBack: null,
};

export function useSendPrefillAddAddressFlow({
  idleHeaderState,
}: UseSendPrefillAddAddressFlowOptions): SendPrefillAddAddressFlow {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { navigation } = useFlowWizard<SendFlowStep>();
  const { state, recipientSearch } = useSendFlowData();
  const { setState: setHeaderState } = useAddNewContactHeaderController();
  const [isOpeningAddressFlow, setIsOpeningAddressFlow] = useState(false);
  const selectedContactRef = useRef<Contact | null>(null);
  const saveRequestId = useRef(0);
  const isSaving = useRef(false);
  const addressValidation = useContactsAddressValidationAdapter();
  const { deviceIntents, dieProps } = useContactsIntentsOrchestrator({
    intents: contactsIntentLWDDefinitions,
    getLiveConfigMinVersion: getMinVersion,
  });
  const {
    state: addressFlowState,
    startWithPrefilled,
    updateAddressLabel,
    continueFromName,
    goBack,
    close,
  } = useAddAddressFlowViewModel({ addressValidation });
  const isAddressPhase = isPrefillAddAddressFlowOpen(addressFlowState);

  const cancelPendingSave = useCallback(() => {
    saveRequestId.current += 1;
    isSaving.current = false;
  }, []);

  const handleAddressPhaseBack = useCallback(() => {
    cancelPendingSave();
    if (addressFlowState.status === "namingAddress") {
      close();
      return;
    }
    goBack();
  }, [addressFlowState.status, cancelPendingSave, close, goBack]);

  useEffect(() => {
    if (isAddressPhase) {
      setHeaderState({
        ...ADDRESS_PHASE_HEADER_STATE,
        onAddressPhaseBack: handleAddressPhaseBack,
      });
      return;
    }

    setHeaderState(idleHeaderState);
  }, [handleAddressPhaseBack, idleHeaderState, isAddressPhase, setHeaderState]);

  useEffect(
    () => () => {
      cancelPendingSave();
      setHeaderState(DEFAULT_ADD_NEW_CONTACT_HEADER_STATE);
    },
    [cancelPendingSave, setHeaderState],
  );

  const saveFromReview = useCallback(async () => {
    if (
      isSaving.current ||
      addressFlowState.status !== "reviewingAddress" ||
      addressFlowState.entryMode !== "prefilled"
    ) {
      return;
    }

    const selectedContact = selectedContactRef.current;
    if (!selectedContact) {
      return;
    }

    const requestId = saveRequestId.current;
    isSaving.current = true;

    try {
      const signedAddress = await deviceIntents.registerExternalAddress({
        contact: selectedContact,
        currencyId: addressFlowState.selectedCurrencyId,
        label: addressFlowState.addressLabel.label,
        address: addressFlowState.addressEntry.resolvedAddress,
      });

      if (saveRequestId.current !== requestId) {
        return;
      }

      dispatch(
        addAddress({
          contactId: selectedContact.id,
          address: contactAddress({
            id: `address-${uuid()}`,
            currencyId: addressFlowState.selectedCurrencyId,
            label: addressFlowState.addressLabel.label,
            address: addressFlowState.addressEntry.resolvedAddress,
            device: signedAddress.addressDeviceContext,
          }),
          deviceCredentials: signedAddress.deviceCredentials,
        }),
      );

      close();
      navigation.resetToStep(SEND_FLOW_STEP.RECIPIENT);
    } catch {
      return;
    } finally {
      if (saveRequestId.current === requestId) {
        isSaving.current = false;
      }
    }
  }, [addressFlowState, close, deviceIntents, dispatch, navigation]);

  const startForContact = useCallback(
    async (contact: Contact) => {
      selectedContactRef.current = contact;
      const params = resolvePrefillAddAddressParams({
        address: recipientSearch.value,
        currency: state.account.currency,
      });

      if (!params) {
        navigation.resetToStep(SEND_FLOW_STEP.RECIPIENT);
        return;
      }

      setIsOpeningAddressFlow(true);
      try {
        const result = await startWithPrefilled({
          contact,
          address: params.address,
          currency: params.currency,
          network: params.network,
        });
        if (result.status !== "started" && result.status !== "cancelled") {
          navigation.resetToStep(SEND_FLOW_STEP.RECIPIENT);
        }
      } finally {
        setIsOpeningAddressFlow(false);
      }
    },
    [navigation, recipientSearch.value, startWithPrefilled, state.account.currency],
  );

  const entryLabels = useMemo<AddAddressEntryLabels>(
    () => ({
      title: t("contacts.addAddressEntry.title"),
      addressPlaceholder: t("contacts.addAddressEntry.addressPlaceholder"),
      confirmAddress: t("contacts.addAddressEntry.confirmAddress"),
      validatingAddress: t("contacts.addAddressEntry.validatingAddress"),
      validAddress: t("contacts.addAddressEntry.validAddress"),
      invalidAddress: t("contacts.addAddressEntry.invalidAddress"),
      domainNotFound: t("contacts.addAddressEntry.domainNotFound"),
      sanctionedAddress: t("contacts.addAddressEntry.sanctionedAddress"),
      validationUnavailable: t("contacts.addAddressEntry.validationUnavailable"),
      ensDisclaimer: t("contacts.addAddressEntry.ensDisclaimer"),
    }),
    [t],
  );
  const nameLabels = useMemo<ContactsAddAddressNameLabels>(
    () => ({
      inputLabel: t("contacts.addAddressName.inputLabel"),
      namingDisclaimer: t("contacts.addAddressName.namingDisclaimer"),
      namingDisclaimerAccessibilityLabel: t(
        "contacts.addAddressName.namingDisclaimerAccessibilityLabel",
      ),
      continueToReview: t("contacts.addAddressName.continueToReview"),
      validAddress: t("contacts.addAddressEntry.validAddress"),
      validationErrors: {
        [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.invalidLabel"),
        [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.duplicateLabel"),
        [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: t("contacts.addAddressName.tooLongLabel"),
      },
    }),
    [t],
  );
  const reviewLabels = useMemo<ContactsAddAddressReviewLabels>(
    () => ({
      title: t("contacts.addAddressReview.title"),
      addressLabel: t("contacts.addAddressReview.addressLabel"),
      currencyLabel: t("contacts.addAddressReview.currencyLabel"),
      networkLabel: t("contacts.addAddressReview.networkLabel"),
      nameLabel: t("contacts.addAddressReview.nameLabel"),
      continue: t("contacts.addAddressReview.continue"),
    }),
    [t],
  );
  const addressPhase = isAddressPhase
    ? {
        state: addressFlowState,
        entryLabels,
        nameLabels,
        reviewLabels,
        dieProps,
        onAddressLabelChange: updateAddressLabel,
        onContinueFromName: continueFromName,
        onContinueFromReview: () => {
          void saveFromReview();
        },
      }
    : null;

  return {
    addressPhase,
    isOpeningAddressFlow,
    startForContact,
  };
}
