import React from "react";
import { ModalBody } from "~/renderer/components/Modal";
import LogicContent, { Data } from "./Body";

const Body = ({ data, onClose }: { data: Data; onClose?: () => void | undefined }) => {
  const { onCancel } = data;

  return (
    <ModalBody
      onClose={() => {
        onCancel(new Error("Interrupted by user"));
        onClose?.();
      }}
      render={() => <LogicContent data={data} onClose={onClose} />}
    />
  );
};

export default Body;
