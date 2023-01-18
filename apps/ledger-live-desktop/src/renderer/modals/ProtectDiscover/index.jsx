// @flow

import React from "react";
import Modal from "~/renderer/components/Modal";
import ProtectDiscoverBody from "./ProtectDiscoverBody";

const ProtectDiscoverModal = () => (
  <Modal
    name="MODAL_PROTECT_DISCOVER"
    centered
    render={({ data, onClose }) => <ProtectDiscoverBody version={data} onClose={onClose} />}
  />
);

export default ProtectDiscoverModal;
