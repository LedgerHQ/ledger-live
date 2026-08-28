import { useCallback } from "react";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";

type AddContactViewModel = Readonly<{
  onAddNewContact?: () => void;
  onAddToExistingContact?: () => void;
}>;

export function useAddContactViewModel(): AddContactViewModel {
  const { navigation } = useFlowWizard<SendFlowStep>();

  const onAddNewContact = useCallback(() => {
    navigation.goToStep(SEND_FLOW_STEP.ADD_NEW_CONTACT);
  }, [navigation]);

  const onAddToExistingContact = useCallback(() => {
    navigation.goToStep(SEND_FLOW_STEP.ADD_TO_EXISTING_CONTACT);
  }, [navigation]);

  return {
    onAddNewContact,
    onAddToExistingContact,
  };
}
