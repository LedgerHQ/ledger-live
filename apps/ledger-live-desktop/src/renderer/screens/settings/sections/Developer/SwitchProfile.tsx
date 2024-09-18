import { ipcRenderer } from "electron";
import React, { useCallback, useEffect, useState } from "react";
import Button from "~/renderer/components/Button";
import { useTranslation } from "react-i18next";
import { readFile, writeFile } from "fs";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import { useHistory } from "react-router-dom";
import styled from "styled-components";
import { Flex, Input } from "@ledgerhq/react-ui";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { getKey, setKey } from "~/renderer/storage";
import * as fs from "fs";
import * as path from "path";

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 15px;
`;
const SwitchProfile = () => {
  // Take inspiration from
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { state: localLiveApps } = useLocalLiveAppContext();

  const [newProfileName, setNewProfileName] = useState("");
  // TODO: validate name to be in slug format

  const [newProfileComment, setNewProfileComment] = useState("");

  const [profiles, setProfiles] = useState([]);
  const [inUse, setInUse] = useState("");

  useEffect(() => {
    getKey("profiles", "list")
      .then(data => {
        console.log({ data });
        setProfiles(data);
        return getKey("profiles", "inUse");
        // setProfiles(data)
      })
      .then(inUse => {
        setInUse(inUse);
        console.log({ inUse });
      });
  }, []);

  const onSaveProfile = useCallback(() => {
    // TODO:
    // setKey("profiles")
    //  - save profile to profile.json
    //  - save app_{name}.json
    const updatedProfiles = [...profiles, { name: newProfileName, comment: newProfileComment }];
    // TODO: validate name to be in slug format
    // TODO: validate name to be unique
    console.log({ updatedProfiles });
    setKey("profiles", "list", updatedProfiles);
    setProfiles(updatedProfiles);
    // NOTE: ^ optimistic update, maybe handle errors instead
  }, [newProfileName, newProfileComment, profiles]);

  const loadProfile = useCallback(async (name: string) => {
    // TODO:
    const res = await setKey("profiles", "inUse", name);
    setInUse(name); // NOTE: optimistic update
    // force electron to reload
    // ipcRenderer.send("reload");
    // ipcRenderer.send("reloadRenderer");
    setTimeout(() => {
      ipcRenderer.send("app-reload");
    }, 2000);
  }, []);

  const importProfile = useCallback(
    async (name: string) => {
      const { filePaths } = await ipcRenderer.invoke("show-open-dialog", {
        title: "Import app.json profile",
        filters: [
          {
            name: "All Files",
            extensions: ["json"],
          },
        ],
      });
      if (filePaths && filePaths[0]) {
        const file = fs.readFileSync(filePaths[0]);
        const data = JSON.parse(file.toString());

        console.log(data);

        const updatedProfiles = [
          ...(profiles || []),
          { name: newProfileName, comment: newProfileComment },
        ];

        // console.log(path.join(__dirname, "../userdata/", `test.json`));

        const userDataPath = await ipcRenderer.invoke("getPathUserData");

        fs.writeFileSync(`${userDataPath}/app_${newProfileName}.json`, JSON.stringify(data));

        /*console.log({ updatedProfiles });
        setKey("profiles", "list", updatedProfiles);
        setProfiles(updatedProfiles);*/

        setKey("profiles", "list", updatedProfiles);
        setProfiles(updatedProfiles);
      }
    },
    [newProfileName, newProfileComment, profiles],
  );

  const onDeleteProfile = useCallback((name: string) => {
    // TODO:
    // if inUse === name
    // change inUse to another profile name if it exists
    // remove profile name from list
  }, []);

  return (
    <>
      <Row title={"Add a profile"} desc={"TODO: desc"}>
        <Flex flexDirection={"row"} columnGap={3}>
          <Input placeholder={"name"} value={newProfileName} onChange={setNewProfileName} />
          <Input
            placeholder={"comment"}
            value={newProfileComment}
            onChange={setNewProfileComment}
          />
          <Flex flexDirection={"column"} rowGap={3}>
            <Button small primary onClick={onSaveProfile} data-testid="settings-save-profile">
              Create new profile
            </Button>
            <Button small primary onClick={importProfile} data-testid="settings-import-profile">
              Import from file
            </Button>
          </Flex>
        </Flex>
      </Row>
      {(profiles || []).map((profile: any) => (
        <Row key={profile.name} title={profile.name} desc={profile.comment}>
          <ButtonContainer>
            {profile.name === inUse ? (
              <Button small primary disabled>
                In Use
              </Button>
            ) : (
              <Button
                small
                outline
                onClick={() => {
                  loadProfile(profile.name);
                }}
              >
                Load
              </Button>
            )}
            {/* TODO: edit button */}

            <Button small danger onClick={onDeleteProfile}>
              {"Delete"}
            </Button>
            {/* TODO: share using ipfs + fileverse.io ? */}
          </ButtonContainer>
        </Row>
      ))}
    </>
  );
};
export default SwitchProfile;
