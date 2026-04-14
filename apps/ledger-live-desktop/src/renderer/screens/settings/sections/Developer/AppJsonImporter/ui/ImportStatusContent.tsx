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
          <p className={statusTextStyles({ className: "text-center" })}>
            {t("settings.developer.appJsonImporter.importing")}
          </p>
        </>
      );
    case "success":
      return (
        <div className="w-full text-left">
          <div className="flex items-center justify-center gap-2 mb-3 text-success">
            <Check size={16} />
            <span className="body-3 font-medium">
              {t("settings.developer.appJsonImporter.successLabel")}
            </span>
          </div>
          <dl className="grid body-3 gap-y-1" style={{ gridTemplateColumns: "auto 1fr" }}>
            <dt className={statusTextStyles({ className: "pr-6 whitespace-nowrap" })}>
              {t("settings.developer.appJsonImporter.appJsonFile")}
            </dt>
            <dd className={statusTextStyles()}>{status.fileName}</dd>

            <dt className={statusTextStyles({ className: "pr-6 whitespace-nowrap" })}>
              {t("settings.developer.appJsonImporter.accountsImported")}
            </dt>
            <dd className={statusTextStyles()}>{status.accountCount}</dd>

            {status.failedEntries.length > 0 ? (
              <>
                <dt
                  className={statusTextStyles({
                    variant: "warning",
                    className: "pr-6 whitespace-nowrap self-start",
                  })}
                >
                  {t("settings.developer.appJsonImporter.accountsFailed")}
                </dt>
                <dd className={statusTextStyles({ variant: "warning" })}>
                  <ul>
                    {status.failedEntries.map(entry => (
                      <li key={`${entry.currencyId}-${entry.accountName ?? ""}-${entry.reason}`}>
                        {entry.accountName ?? entry.currencyId}
                      </li>
                    ))}
                  </ul>
                </dd>
              </>
            ) : null}
          </dl>
        </div>
      );
    case "error":
      return (
        <>
          <Warning size={24} />
          <p className={statusTextStyles({ variant: "error", className: "text-center" })}>
            {status.message}
          </p>
        </>
      );
    default:
      return (
        <>
          <CloudUpload size={24} />
          <p className={statusTextStyles({ className: "text-center" })}>
            {t("settings.developer.appJsonImporter.dropOrBrowse")}
          </p>
        </>
      );
  }
};
