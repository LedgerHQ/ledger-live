import { useCallback, useEffect, useMemo } from "react";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import { useFlowWizard } from "../../../../FlowWizard/FlowWizardContext";
import { useSendFlowData } from "../../../context/SendFlowContext";
import { getSendFlowTrackingProperties } from "../../../utils/tracking";
import { track, trackPage } from "~/renderer/analytics/segment";

type AddContactViewModel = Readonly<{
  onAddNewContact?: () => void;
  onAddToExistingContact?: () => void;
}>;

export function useAddContactViewModel(): AddContactViewModel {
  const { navigation } = useFlowWizard<SendFlowStep>();
  const { state } = useSendFlowData();
  const trackingProperties = useMemo(
    () => getSendFlowTrackingProperties(state.account.account, state.account.parentAccount),
    [state.account.account, state.account.parentAccount],
  );

  useEffect(() => {
    trackPage("Modal send - add contact options", null, trackingProperties);
  }, [trackingProperties]);

  const onAddNewContact = useCallback(() => {
    track("button_clicked", {
      button: "add a new contact",
      page: "add contact options",
      ...trackingProperties,
    });
    navigation.goToStep(SEND_FLOW_STEP.ADD_NEW_CONTACT);
  }, [navigation, trackingProperties]);

  const onAddToExistingContact = useCallback(() => {
    track("button_clicked", {
      button: "add to an existing contact",
      page: "add contact options",
      ...trackingProperties,
    });
    navigation.goToStep(SEND_FLOW_STEP.ADD_TO_EXISTING_CONTACT);
  }, [navigation, trackingProperties]);

  return {
    onAddNewContact,
    onAddToExistingContact,
  };
}
