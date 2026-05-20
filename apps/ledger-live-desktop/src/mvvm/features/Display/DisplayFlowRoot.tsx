import React, { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { DisplayWorkflow } from ".";
import { closeDisplayFlowDialog, displayFlowStateSelector } from "~/renderer/reducers/displayFlow";

/**
 * Display POC root.
 *
 * Same pattern as `SendFlowRoot`: this is mounted once in `GlobalDialogs` and
 * reads its open state from redux (`displayFlow` slice). Any feature in the
 * app can trigger the dialog via `useOpenDisplayFlow()`.
 */
function DisplayFlowRoot() {
  const dispatch = useDispatch();
  const { isOpen, data } = useSelector(displayFlowStateSelector);

  const handleClose = useCallback(() => {
    dispatch(closeDisplayFlowDialog());
  }, [dispatch]);

  if (!isOpen) return null;

  return <DisplayWorkflow onClose={handleClose} params={data?.params} isOpen={isOpen} />;
}

export default DisplayFlowRoot;
