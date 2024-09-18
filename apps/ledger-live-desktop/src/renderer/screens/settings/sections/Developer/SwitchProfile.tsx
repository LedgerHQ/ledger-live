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
    const updatedProfiles = [...profiles, { name: newProfileName, comment: newProfileComment }]
    // TODO: validate name to be in slug format
    // TODO: validate name to be unique
    console.log({updatedProfiles})
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
          <Button
            small
            primary
            onClick={onSaveProfile}
            data-testid="settings-open-local-manifest-form"
          >
            Create new profile
          </Button>
        </Flex>
      </Row>
      {profiles.map((profile: any) => (
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
