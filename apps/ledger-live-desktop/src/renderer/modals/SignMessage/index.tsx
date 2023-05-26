import React from "react";
import Modal, { RenderProps } from "~/renderer/components/Modal";
import Body, { Data } from "./Body";
const SignMessage = (props: { onClose?: () => void }) => {
  // TODO: what is this rest thing?
  const rest: typeof props = {};
  if (props.onClose) {
    rest.onClose = props.onClose;
  }
  return (
    <Modal
      name="MODAL_SIGN_MESSAGE"
      centered
      render={({ data, onClose }: RenderProps<Data>) => <Body onClose={onClose} data={data} />}
      {...rest}
    />
  );
};
export default SignMessage;
