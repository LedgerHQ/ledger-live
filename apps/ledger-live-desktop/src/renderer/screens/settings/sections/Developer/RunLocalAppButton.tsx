import { downloadJson } from "~/renderer/files";

import React, { useCallback, useRef } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import { useNavigate } from "react-router";
import styled from "styled-components";
import { Flex } from "@ledgerhq/react-ui";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 15px;
`;
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
      const exportedManifest = localLiveApps.find((m: LiveAppManifest) => m.id === id);
      const manifestData = JSON.stringify(exportedManifest, null, 2);
      downloadJson(`${name}-manifest.json`, manifestData);
    },
    [localLiveApps],
  );

  const manifestInputRef = useRef<HTMLInputElement>(null);

  const onLocalManifestPicked = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      try {
        const manifest = JSON.parse(await file.text());
        if (Array.isArray(manifest)) {
          manifest.forEach(m => addLocalManifest(m));
        } else {
          addLocalManifest(manifest);
        }
      } catch (error) {
        console.log(error);
      }
    },
    [addLocalManifest],
  );

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
          <input
            ref={manifestInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={onLocalManifestPicked}
            data-testid="settings-import-local-manifest-input"
          />
          <Button size="sm" appearance="accent" onClick={() => manifestInputRef.current?.click()}>
            {t("settings.developer.addLocalAppButton")}
          </Button>

          <Button
            size="sm"
            appearance="accent"
            onClick={() => onOpenModal()}
            data-testid="settings-open-local-manifest-form"
          >
            {t("settings.developer.createLocalAppModal.create")}
          </Button>
        </Flex>
      </Row>
      {localLiveApps.map((manifest: LiveAppManifest) => (
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        <Row key={manifest.id} title={manifest.name} desc={manifest.url as string}>
          <ButtonContainer>
            <Button
              size="sm"
              appearance="accent"
              onClick={() => navigate(`/platform/${manifest.id}`)}
            >
              {t("settings.developer.runLocalAppOpenButton")}
            </Button>
            <Button
              size="sm"
              appearance="transparent"
              onClick={() => {
                onExportLocalManifest(manifest);
              }}
              data-testid="settings-export-local-manifest"
            >
              {t("settings.developer.createLocalAppModal.export")}
            </Button>

            <Button size="sm" appearance="red" onClick={() => removeLocalManifestById(manifest.id)}>
              {t("settings.developer.runLocalAppDeleteButton")}
            </Button>
          </ButtonContainer>
        </Row>
      ))}
    </>
  );
};
export default RunLocalAppButton;
