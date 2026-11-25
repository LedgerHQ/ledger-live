import React from "react";
import { EyeCross, Lock, ShieldCheck } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { SecurityRowIconProps } from "./SecurityRowIcon.types";

const ICON_SIZE = 24;

/** The leading icon of a row. The rows that follow App lock have none. */
export function SecurityRowIcon({ id }: SecurityRowIconProps) {
  switch (id) {
    case "hideBalance":
      return <EyeCross size={ICON_SIZE} />;
    case "appLock":
      return <Lock size={ICON_SIZE} />;
    case "mevProtection":
      return <ShieldCheck size={ICON_SIZE} />;
    default:
      return null;
  }
}
