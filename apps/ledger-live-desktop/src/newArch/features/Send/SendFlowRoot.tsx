import React, { useCallback } from "react";
import { createPortal } from "react-dom";
import { DomainServiceProvider } from "@ledgerhq/domain-service/hooks/index";
import { useDispatch, useSelector } from "react-redux";
import { SendWorkflow } from ".";
import { closeSendFlowDialog, sendFlowStateSelector } from "~/renderer/reducers/sendFlow";
import { setMemoTagInfoBoxDisplay } from "~/renderer/actions/UI";
import Snow, { isSnowTime } from "~/renderer/extra/Snow";

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
    <>
      {isSnowTime() && isOpen
        ? createPortal(
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "130vh",
                pointerEvents: "none",
                zIndex: 99,
                overflow: "hidden",
              }}
            >
              <Snow numFlakes={100} />
            </div>,
            document.body,
          )
        : null}
      <DomainServiceProvider>
        <SendWorkflow onClose={handleClose} params={data?.params} isOpen={isOpen} />
      </DomainServiceProvider>
    </>
  );
}
