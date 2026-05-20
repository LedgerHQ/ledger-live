import React from "react";
import GenericAwarenessModalView from "./GenericAwarenessModalView";
import useGenericAwarenessModalViewModel from "./hooks/useGenericAwarenessModalViewModel";

const GenericAwarenessModal = () => (
  <GenericAwarenessModalView {...useGenericAwarenessModalViewModel()} />
);

export default GenericAwarenessModal;
