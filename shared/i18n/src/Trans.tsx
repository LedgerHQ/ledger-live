import React from "react";
import { Trans as ReactI18nextTrans } from "react-i18next";
import { useI18n } from "./context";

export type TransProps = Omit<React.ComponentProps<typeof ReactI18nextTrans>, "i18n">;

/**
 * `react-i18next`'s `Trans`, bound to the instance injected at the app root. Use it when a
 * translation interpolates React nodes; plain strings go through `useTranslation`.
 */
export function Trans(props: TransProps) {
  return <ReactI18nextTrans {...props} i18n={useI18n()} />;
}
