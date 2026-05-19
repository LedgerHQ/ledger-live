import React from "react";
import useLiveAppModalViewModel from "./useLiveAppModalViewModel";
import LiveAppModalView from "./LiveAppModalView";

const LiveAppModal = () => <LiveAppModalView {...useLiveAppModalViewModel()} />;

export default LiveAppModal;
