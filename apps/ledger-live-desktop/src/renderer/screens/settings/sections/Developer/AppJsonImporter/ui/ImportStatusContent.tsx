import React from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import { CloudUpload, Check, Warning } from "@ledgerhq/lumen-ui-react/symbols";
import type { ImportStatus } from "../types";
import { statusTextStyles } from "./statusStyles";

type Props = {
  status: ImportStatus;
};

export const ImportStatusContent = ({ status }: Props) => {
  const { t } = useTranslation();

  switch (status.kind) {
    case "loading":
      return (
        <>
          <Spinner size={24} />
          <p className={statusTextStyles({})}>
            {t("settings.developer.appJsonImporter.importing")}
          </p>
        </>
      );
    case "success":
      return (
        <>
          <Check size={24} />
          <p className={statusTextStyles({ variant: "success" })}>
            {t("settings.developer.appJsonImporter.success", { count: status.accountCount })}
          </p>
          {status.lastDeviceLabel ? (
            <p className={statusTextStyles({ variant: "success" })}>
              {t("settings.developer.appJsonImporter.lastDeviceSeen", {
                device: status.lastDeviceLabel,
              })}
            </p>
          ) : null}
        </>
      );
    case "error":
      return (
        <>
          <Warning size={24} />
          <p className={statusTextStyles({ variant: "error" })}>{status.message}</p>
        </>
      );
    default:
      return (
        <>
          <CloudUpload size={24} />
          <p className={statusTextStyles({})}>
            {t("settings.developer.appJsonImporter.dropOrBrowse")}
          </p>
        </>
      );
  }
};
