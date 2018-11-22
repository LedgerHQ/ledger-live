/* @flow */
import React from "react";
import TouchID from "../icons/TouchID";
import FaceID from "../icons/FaceID";
import Fingerprint from "../icons/Fingerprint";

const BiometricsIcon = ({ biometricsType, ...props }: *) => {
  switch (biometricsType) {
    case "TouchID":
      return <TouchID {...props} />;
    case "FaceID":
      return <FaceID {...props} />;
    case "Fingerprint":
      return <Fingerprint {...props} />;
    default:
      return null;
  }
};

export default BiometricsIcon;
