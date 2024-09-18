import React from "react";
import Button from "~/renderer/components/Button";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import styled from "styled-components";
import { Flex, IconsLegacy } from "@ledgerhq/react-ui";

import useProfile, { ProfileInfos } from "./useProfile";
import Switch from "~/renderer/components/Switch";
import Input from "~/renderer/components/Input";
import Text from "~/renderer/components/Text";
import { ItemContainer } from "~/renderer/components/TopBar/shared";
import { useLocation } from 'react-router-dom';

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
    newProfileTransferSettings,
    setNewProfileName,
    setNewProfileDescription,
    setNewProfileTransferSettings,
    createProfile,
    removeProfile,
    importProfile,
    switchProfile,
    shareProfile,
  } = useProfile();
  // console.log({windowlocation: window.location.search})

  const startingProfile = { id: "", name: "starting profile", description: "starting profile" };
  const profilesWithStartProfile = [startingProfile, ...profiles];
  


  return (
    <>
      <Row title={"Add a profile"} desc={""}>
        <Flex flexDirection={"row"} columnGap={3}>
          <Flex flexDirection={"column"} rowGap={3}>
            <Flex flexDirection={"row"} columnGap={3}>
              <Input placeholder={"name"} value={newProfileName} onChange={setNewProfileName} />
              <Input
                placeholder={"description"}
                value={newProfileDescription}
                onChange={setNewProfileDescription}
              />
            </Flex>
            <Flex flexDirection={"row"} columnGap={3}>
              <Flex justifyContent="space-between" alignItems="center">
                <Switch
                  isChecked={newProfileTransferSettings}
                  onChange={() => setNewProfileTransferSettings(!newProfileTransferSettings)}
                />
                <Text ml={2} fontSize={4}>
                  {"Copy current settings to this profile"}
                </Text>
              </Flex>
            </Flex>
          </Flex>

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
            <Button
              small
              primary
              disabled={newProfileName === ""}
              onClick={importProfile}
              data-testid="settings-import-profile"
            >
              Import from file
            </Button>
          </Flex>
        </Flex>
      </Row>

      {profilesWithStartProfile.map((profile: ProfileInfos) => (
        <Row
          key={profile.id}
          title={profile.name}
          desc={`${profile.description} id = ${profile.id}`}
        >
          <Flex flexDirection={"row"} columnGap={3}>
          <ItemContainer
            isInteractive
            onClick={() => shareProfile(profile.id)}
          >
            <IconsLegacy.ShareMedium size={18} />
          </ItemContainer>

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
          </Flex>
        </Row>
      ))}
    </>
  );
};
export default SwitchProfile;
