import React from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";

const SignMessage = (props: { onClose?: () => void }) => {
  return (
    <Modal
      name="MODAL_SIGN_MESSAGE"
      centered
      render={({ data, onClose }) => <Body onClose={onClose} data={data} />}
      onClose={props.onClose}
    />
  );
};
export default SignMessage;
