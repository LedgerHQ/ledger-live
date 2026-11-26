import React from "react";
import {
  EyeCross,
  FaceId,
  Fingerprint,
  Lock,
  ShieldCheck,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import type { SecurityRowIconProps } from "./SecurityRowIcon.types";

const ICON_SIZE = 24;

/** The leading icon of a row. The biometrics icon follows what the device offers. */
export function SecurityRowIcon({ id, biometricKind }: SecurityRowIconProps) {
  switch (id) {
    case "hideBalance":
      return <EyeCross size={ICON_SIZE} />;
    case "appLock":
      return <Lock size={ICON_SIZE} />;
    case "biometrics":
      return biometricKind === "faceId" ? (
        <FaceId size={ICON_SIZE} />
      ) : (
        <Fingerprint size={ICON_SIZE} />
      );
    case "mevProtection":
      return <ShieldCheck size={ICON_SIZE} />;
    default:
      return null;
  }
}
