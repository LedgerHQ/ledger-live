import { ipcRenderer } from "electron";

import React, { useCallback } from "react";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import { readFile, writeFile } from "fs";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { Flex } from "@ledgerhq/react-ui";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
`;
const RunLocalAppButton = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const {
    addLocalManifest,
    state: { liveAppByIndex },
    removeLocalManifestById,
  } = useLocalLiveAppContext();

  const history = useHistory();

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
            console.log("id", id);

            const exportedManifest = liveAppByIndex.find(manifest => manifest.id === id);

            const manifestData = JSON.stringify(exportedManifest, null, 2);
            try {
              writeFile(response.filePath, manifestData, "utf-8", () =>
                console.log("File exported successfully!"),
              );
            } catch (parseError) {
              console.log(parseError);
            }
          }
        });
    },
    [liveAppByIndex],
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
      <Row
        title={t("settings.developer.addLocalApp")}
        desc={t("settings.developer.addLocalAppDesc")}
      >
        <Flex flexDirection={"row"} columnGap={3}>
          <Button
            small
            primary
            onClick={onBrowseLocalManifest}
            data-test-id="settings-enable-platform-dev-tools-apps"
          >
            {t("settings.developer.addLocalAppButton")}
          </Button>

          <Button
            small
            primary
            onClick={() => {
              onOpenModal();
            }}
            data-test-id="settings-enable-platform-dev-tools-apps"
          >
            {t("settings.developer.createLocalAppModal.create")}
          </Button>
        </Flex>
      </Row>
      {liveAppByIndex.map(manifest => (
        <Row key={manifest.id} title={manifest.name} desc={manifest.url as string}>
          <ButtonContainer style={{ display: "flex", gap: 16 }}>
            <Button small primary onClick={() => history.push(`/platform/${manifest.id}`)}>
              {t("settings.developer.runLocalAppOpenButton")}
            </Button>
            <Button
              small
              outline
              onClick={() => {
                onExportLocalManifest(manifest);
              }}
              data-test-id="settings-enable-platform-dev-tools-apps"
            >
              {t("settings.developer.createLocalAppModal.export")}
            </Button>
            <Button small danger onClick={() => removeLocalManifestById(manifest.id)}>
              {t("settings.developer.runLocalAppDeleteButton")}
            </Button>
          </ButtonContainer>
        </Row>
      ))}
    </>
  );
};
export default RunLocalAppButton;
