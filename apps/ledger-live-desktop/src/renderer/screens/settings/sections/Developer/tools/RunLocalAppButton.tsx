import { ipcRenderer } from "electron";

import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { readFile, writeFile } from "fs";
import { useNavigate } from "react-router";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import DeveloperActionsRow from "../components/DeveloperActionsRow";
const RunLocalAppButton = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const {
    addLocalManifest,
    state: localLiveApps,
    removeLocalManifestById,
  } = useLocalLiveAppContext();

  const navigate = useNavigate();

  const onExportLocalManifest = useCallback(
    (manifest: LiveAppManifest) => {
      const { id, name } = manifest;
      ipcRenderer
        .invoke("show-save-dialog", {
          title: "Export Manifest",
          defaultPath: `${name}-manifest.json`,
          buttonLabel: "Export",
          filters: [{ name: "JSON", extensions: ["json"] }],
        })
        .then(function (response) {
          if (!response.canceled && response.filePath) {
            const exportedManifest = localLiveApps.find(
              (manifest: LiveAppManifest) => manifest.id === id,
            );

            const manifestData = JSON.stringify(exportedManifest, null, 2);
            try {
              writeFile(response.filePath, manifestData, "utf-8", () =>
                console.log("File exported successfully!"),
              );
            } catch (parseError) {
              console.warn(parseError);
            }
          }
        });
    },
    [localLiveApps],
  );

  const onBrowseLocalManifest = useCallback(() => {
    ipcRenderer
      .invoke("show-open-dialog", {
        properties: ["openFile"],
      })
      .then(function (response) {
        if (!response.canceled) {
          const fileName = response.filePaths[0];
          readFile(fileName, (readError, data) => {
            if (!readError) {
              try {
                const manifest = JSON.parse(data.toString());
                if (Array.isArray(manifest)) {
                  manifest.forEach(m => {
                    addLocalManifest(m);
                  });
                } else {
                  addLocalManifest(manifest);
                }
              } catch (parseError) {
                console.log(parseError);
              }
            }
          });
        } else {
          console.log("no file selected");
        }
      });
  }, [addLocalManifest]);

  const onOpenModal = useCallback(
    (manifest?: LiveAppManifest) => {
      dispatch(
        openModal("MODAL_CREATE_LOCAL_APP", {
          manifest,
        }),
      );
    },
    [dispatch],
  );

  return (
    <>
      <DeveloperActionsRow
        title={t("settings.developer.addLocalApp")}
        desc={t("settings.developer.addLocalAppDesc")}
        actions={[
          {
            key: "browse-local-manifest",
            label: t("settings.developer.addLocalAppButton"),
            onClick: onBrowseLocalManifest,
          },
          {
            key: "create-local-app",
            label: t("settings.developer.createLocalAppModal.create"),
            onClick: () => onOpenModal(),
            dataTestId: "settings-open-local-manifest-form",
          },
        ]}
      />
      {localLiveApps.map((manifest: LiveAppManifest) => (
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        <DeveloperActionsRow
          key={manifest.id}
          title={manifest.name}
          desc={manifest.url as string}
          actions={[
            {
              key: `${manifest.id}-open`,
              label: t("settings.developer.runLocalAppOpenButton"),
              onClick: () => navigate(`/platform/${manifest.id}`),
            },
            {
              key: `${manifest.id}-export`,
              label: t("settings.developer.createLocalAppModal.export"),
              appearance: "transparent",
              onClick: () => {
                onExportLocalManifest(manifest);
              },
              dataTestId: "settings-export-local-manifest",
            },
            {
              key: `${manifest.id}-delete`,
              label: t("settings.developer.runLocalAppDeleteButton"),
              appearance: "red",
              onClick: () => removeLocalManifestById(manifest.id),
            },
          ]}
        />
      ))}
    </>
  );
};
export default RunLocalAppButton;
