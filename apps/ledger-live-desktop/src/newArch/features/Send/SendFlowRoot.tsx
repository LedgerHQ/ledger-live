import React, { useCallback } from "react";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { SendWorkflow } from ".";
import { closeSendFlowDialog, sendFlowStateSelector } from "~/renderer/reducers/sendFlow";
import { setMemoTagInfoBoxDisplay } from "~/renderer/reducers/UI";

export function SendFlowRoot() {
  const dispatch = useDispatch();
  const { isOpen, data } = useSelector(sendFlowStateSelector);

  const handleClose = useCallback(() => {
    dispatch(
      setMemoTagInfoBoxDisplay({
        isMemoTagBoxVisible: false,
        forceAutoFocusOnMemoField: false,
      }),
    );
    data?.onClose?.();
    dispatch(closeSendFlowDialog());
  }, [data, dispatch]);

  if (!isOpen) return null;

  return (
    <DomainServiceProvider>
      <SendWorkflow onClose={handleClose} params={data?.params} isOpen={isOpen} />
    </DomainServiceProvider>
  );
}
