import React from "react";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { AppJsonDropZone } from "./ui/AppJsonDropZone";
import { ImportStatusContent } from "./ui/ImportStatusContent";
import { useAppJsonImporter } from "./useAppJsonImporter";

const AppJsonImporter = () => {
  const { t, status, isDragOver, onDragOver, onDragLeave, onDrop, onFileChange } =
    useAppJsonImporter();

  return (
    <Row
      title={t("settings.developer.appJsonImporter.title")}
      desc={t("settings.developer.appJsonImporter.desc")}
    >
      <AppJsonDropZone
        isDragOver={isDragOver}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onFileChange={onFileChange}
      >
        <ImportStatusContent status={status} />
      </AppJsonDropZone>
    </Row>
  );
};

export default AppJsonImporter;
