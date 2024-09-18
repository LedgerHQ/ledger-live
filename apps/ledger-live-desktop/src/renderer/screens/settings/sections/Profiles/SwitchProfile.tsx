import React from "react";
import Button from "~/renderer/components/Button";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import styled from "styled-components";
import { Flex, Input } from "@ledgerhq/react-ui";

import useProfile, { ProfileInfos } from "./useProfile";

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 15px;
`;

const SwitchProfile = () => {
  const {
    profiles,
    inUseId,
    newProfileName,
    newProfileDescription,
    setNewProfileName,
    setNewProfileDescription,
    createProfile,
    removeProfile,
    importProfile,
    switchProfile,
  } = useProfile();

  console.log("IN SUE: ", inUseId);
  return (
    <>
      <Row title={"Add a profile"} desc={"TODO: desc"}>
        <Flex flexDirection={"row"} columnGap={3}>
          <Input placeholder={"name"} value={newProfileName} onChange={setNewProfileName} />
          <Input
            placeholder={"description"}
            value={newProfileDescription}
            onChange={setNewProfileDescription}
          />
          <Flex flexDirection={"column"} rowGap={3}>
            <Button
              small
              primary
              disabled={newProfileName === ""}
              onClick={createProfile}
              data-testid="settings-save-profile"
            >
              Create new profile
            </Button>
            <Button small primary onClick={importProfile} data-testid="settings-import-profile">
              Import from file
            </Button>
          </Flex>
        </Flex>
      </Row>

      {profiles.map((profile: ProfileInfos) => (
        <Row key={profile.name} title={profile.name} desc={`${profile.description} id = ${profile.id}`}>
          <ButtonContainer>
            {profile.id === inUseId ? (
              <Button small primary disabled>
                In Use
              </Button>
            ) : (
              <Button
                small
                outline
                onClick={() => {
                  switchProfile(profile.id);
                }}
              >
                Load
              </Button>
            )}

            <Button
              small
              danger
              disabled={profile.id === inUseId || profile.id === ""}
              onClick={() => removeProfile(profile.id)}
            >
              {"Delete"}
            </Button>
          </ButtonContainer>
        </Row>
      ))}
    </>
  );
};
export default SwitchProfile;