import React, { useMemo } from "react";
import { Account, AccountLike, AnyMessage } from "@ledgerhq/types-live";
import DeviceAction from "~/renderer/components/DeviceAction";
import { useDispatch } from "react-redux";
import { getEnv } from "@ledgerhq/live-env";
import { signMessageExec, createAction } from "@ledgerhq/live-common/hw/signMessage/index";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { closeModal } from "~/renderer/actions/modals";
import connectApp from "@ledgerhq/live-common/hw/connectApp";
import { dependenciesToAppRequests } from "@ledgerhq/live-common/hw/actions/app";
import { ModalBody } from "~/renderer/components/Modal";

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

const Body = ({ onClose, data }: Props) => {
  const dispatch = useDispatch();
  const request = useMemo(() => {
    const appRequests = dependenciesToAppRequests(data.dependencies);
    return {
      account: data.account as Account,
      message: data.message,
      appName: data.useApp,
      dependencies: appRequests,
      isACRE: data.isACRE,
    };
  }, [data]);
  return (
    <ModalBody
      onClose={onClose}
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
