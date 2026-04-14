import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { initAccounts } from "~/renderer/actions/accounts";
import { fetchSettings } from "~/renderer/actions/settings";
import { decodeAccountRawEntries } from "./decodeAccountEntries";
import type { AppJson, FailedAccountEntry, ImportStatus } from "./types";

export function useAppJsonImporter() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isDragOver, setIsDragOver] = useState(false);
  const [status, setStatus] = useState<ImportStatus>({ kind: "idle" });

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".json") && file.type !== "application/json") {
        setStatus({
          kind: "error",
          message: t("settings.developer.appJsonImporter.invalidFileType"),
        });
        return;
      }

      setStatus({ kind: "loading" });

      try {
        const text = await file.text();
        const parsed: AppJson = JSON.parse(text);

        if (!parsed.data) {
          setStatus({
            kind: "error",
            message: t("settings.developer.appJsonImporter.missingDataField"),
          });
          return;
        }

        const { accounts: rawAccounts, settings } = parsed.data;

        if (typeof rawAccounts === "string") {
          setStatus({
            kind: "error",
            message: t("settings.developer.appJsonImporter.encryptedAccounts"),
          });
          return;
        }

        let accountCount = 0;
        let failedEntries: FailedAccountEntry[] = [];

        if (Array.isArray(rawAccounts) && rawAccounts.length > 0) {
          const { decoded, failed } = await decodeAccountRawEntries(rawAccounts);
          dispatch(initAccounts(decoded));
          accountCount = decoded.length;
          failedEntries = failed;
        }

        if (settings) {
          dispatch(fetchSettings(settings));
        }

        setStatus({ kind: "success", fileName: file.name, accountCount, failedEntries });
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : t("settings.developer.appJsonImporter.unknownError");
        setStatus({
          kind: "error",
          message: t("settings.developer.appJsonImporter.importFailed", { message }),
        });
      }
    },
    [dispatch, t],
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile],
  );

  return {
    t,
    status,
    isDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileChange,
  };
}
