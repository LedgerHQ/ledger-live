import React from "react";
import TouchID from "~/icons/TouchID";
import FaceID from "~/icons/FaceID";
import FaceIDFailed from "~/icons/FaceIDFailed";
import Fingerprint from "~/icons/Fingerprint";

type Props = {
  biometricsType?: string | null;
  failed?: boolean;
  size?: number;
  color?: string;
};

const BiometricsIcon = ({ biometricsType, failed, ...props }: Props) => {
  switch (biometricsType) {
    case "TouchID":
      return <TouchID {...props} />;

    case "FaceID":
      return failed ? <FaceIDFailed {...props} /> : <FaceID {...props} />;

    case "Fingerprint":
      return <Fingerprint {...props} />;

    default:
      return null;
  }
};

export default BiometricsIcon;
