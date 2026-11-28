import { useEffect, useRef } from "react";
import { useSelector } from "LLD/hooks/redux";
import { useTransactionAction } from "~/renderer/hooks/useConnectAppAction";
import { selectIsBuyDeviceOpen } from "LLD/features/BuyDevice/buyDeviceDialog";
import { hasOnboardedDeviceSelector } from "~/renderer/reducers/settings";
import { useSendFlowActions } from "../../../context/SendFlowContext";
import { useSendSignatureSession } from "./useSendSignatureSession";

export function useSignatureViewModel() {
  const { close } = useSendFlowActions();
  const {
    account,
    parentAccount,
    transaction,
    request,
    onDeviceActionResult,
    finishWithError,
    onLockedDeviceShown,
    onDeviceConfirmationShown,
  } = useSendSignatureSession();

  const wasBuyDeviceOpenRef = useRef(false);
  const isBuyDeviceOpen = useSelector(selectIsBuyDeviceOpen);
  const hasOnboardedDevice = useSelector(hasOnboardedDeviceSelector);

  // When BuyDevice intercept modal opens then closes without the user having connected a device,
  // close the Send flow to avoid leaving an empty modal behind
  useEffect(() => {
    if (isBuyDeviceOpen) {
      wasBuyDeviceOpenRef.current = true;
    } else if (wasBuyDeviceOpenRef.current && !hasOnboardedDevice) {
      wasBuyDeviceOpenRef.current = false;
      close();
    }
  }, [isBuyDeviceOpen, hasOnboardedDevice, close]);

  const action = useTransactionAction();

  return {
    account,
    parentAccount,
    transaction,
    action,
    request,
    onDeviceActionResult,
    finishWithError,
    onLockedDeviceShown,
    onDeviceConfirmationShown,
  };
}
