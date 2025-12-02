import React, { useCallback } from "react";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import { useDispatch, useSelector } from "react-redux";
import { SendWorkflow } from ".";
import { closeSendFlowDialog, sendFlowStateSelector } from "~/renderer/reducers/sendFlow";
import { setMemoTagInfoBoxDisplay } from "~/renderer/actions/UI";

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

  const handleDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleClose();
      }
    },
    [handleClose],
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="px-0">
        <DomainServiceProvider>
          <SendWorkflow onClose={handleClose} params={data?.params} />
        </DomainServiceProvider>
      </DialogContent>
    </Dialog>
  );
}
