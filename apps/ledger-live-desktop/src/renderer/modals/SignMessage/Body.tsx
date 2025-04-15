import React, { useCallback, useState, useMemo } from "react";
import { AccountLike, AnyMessage } from "@ledgerhq/types-live";
// import Track from "~/renderer/analytics/Track";
// import { Trans, useTranslation } from "react-i18next";
// import StepSummary, { StepSummaryFooter } from "./steps/StepSummary";
// import StepSign from "./steps/StepSign";
// import { St, StepProps } from "./types";
import DeviceAction from "~/renderer/components/DeviceAction";
// import Stepper from "~/renderer/components/Stepper";
import { useDispatch } from "react-redux";
import { getEnv } from "@ledgerhq/live-env";
import { signMessageExec, createAction } from "@ledgerhq/live-common/hw/signMessage/index";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { closeModal } from "~/renderer/actions/modals";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";
import { ModalBody } from "~/renderer/components/Modal";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";

const action = createAction(
  getEnv("MOCK") ? mockedEventEmitter : connectApp,
  getEnv("MOCK") ? mockedEventEmitter : signMessageExec,
);

export type Data = {
  account: AccountLike;
  message: AnyMessage;
  onConfirmationHandler: (arg: string) => void;
  onFailHandler: (arg: Error) => void;
  onClose: () => void;
  useApp?: string;
  dependencies?: string[];
  isACRE?: boolean;
};

type OwnProps = {
  onClose?: () => void;
  data: Data;
};
type Props = OwnProps;
// const steps: St = {
//   id: "sign",
//   label: <Trans i18nKey="signmessage.steps.sign.title" />,
//   component: StepSign,
//   onBack: ({ transitionTo }: StepProps) => {
//     transitionTo("summary");
//   },
// };
const Body = ({ onClose, data }: Props) => {
  // const { t } = useTranslation();
  // const [stepId, setStepId] = useState("sign");
  // const handleStepChange = useCallback((e: { id: string }) => setStepId(e.id), [setStepId]);
  // const stepperOnClose = useCallback(() => {
  //   if (onClose) {
  //     onClose();
  //   }
  //   if (data.onClose) {
  //     data.onClose();
  //   }
  // }, [data, onClose]);
  const dispatch = useDispatch();
  const deviceBlocked = useDeviceBlocked();
  const request = useMemo(() => {
    const appRequests = dependenciesToAppRequests(data.dependencies);
    return {
      account: data.account,
      message: data.message,
      appName: data.useApp,
      dependencies: appRequests,
      isACRE: data.isACRE,
    };
  }, [data]);
  return (
    <ModalBody
      onClose={deviceBlocked ? undefined : onClose}
      noScroll={true}
      render={() => (
        <DeviceAction
          action={action}
          request={request}
          onResult={r => {
            const result = r as {
              error: Error | null | undefined;
              signature: string | null | undefined;
            };
            dispatch(closeModal("MODAL_SIGN_MESSAGE"));
            if (result.error) {
              data.onFailHandler(result.error);
            } else if (result.signature) {
              data.onConfirmationHandler(result.signature);
            }
          }}
        />
      )}
    />
  );
};
export default Body;
