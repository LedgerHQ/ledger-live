import React from "react";
import { Bug, Chart4, Note, UserCircle } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { PrivacyRowIconProps } from "./PrivacyRowIcon.types";

const ICON_SIZE = 24;

/** The leading icon of a row. The Analytics toggle shares the App performance icon. */
export function PrivacyRowIcon({ id }: PrivacyRowIconProps) {
  switch (id) {
    case "bugReports":
      return <Bug size={ICON_SIZE} />;
    case "appPerformance":
    case "analytics":
      return <Chart4 size={ICON_SIZE} />;
    case "personalizedExperience":
      return <UserCircle size={ICON_SIZE} />;
    case "privacyPolicy":
      return <Note size={ICON_SIZE} />;
  }
}
