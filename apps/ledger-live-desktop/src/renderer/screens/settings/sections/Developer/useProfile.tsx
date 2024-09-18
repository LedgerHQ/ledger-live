import { ipcRenderer } from "electron";
import { useCallback, useEffect, useState } from "react";
import { getKey, setKey } from "~/renderer/storage";
import * as fs from "fs";
import { Account } from "@ledgerhq/types-live";
import { toAccountRaw } from "@ledgerhq/live-common/account/serialization";
import { v4 as uuid } from "uuid";

export type ProfileInfos = {
  id: string;
  name: string;
  description: string;
};

const useProfile = () => {
  const [newProfileName, setNewProfileName] = useState<string>("");
  const [newProfileDescription, setNewProfileDescription] = useState<string>("");

  const [profiles, setProfiles] = useState<ProfileInfos[]>([]);
  const [inUseId, setInUseId] = useState<string>("");

  const userDataPath = useCallback(async () => await ipcRenderer.invoke("getPathUserData"), []);
  console.log("userDataPath", userDataPath);

  const initProfile = useCallback(async () => {
    console.log("Initializing profile...");
    const profilesFromStorage = await getKey("profiles", "list");
    const inUseFromStorage = await getKey("profiles", "inUse");

    setProfiles(profilesFromStorage as ProfileInfos[]);
    setInUseId(inUseFromStorage as string);
    console.log({ inUseId, profilesFromStorage });
    console.log("Profile initialized.");
  }, [inUseId]);

  useEffect(() => {
    initProfile();
  }, [initProfile]);

  function makeAppJSON(accounts: Account[]) {
    console.log("Creating app JSON...");
    const jsondata = {
      data: {
        settings: {
          hasCompletedOnboarding: true,
        },
        accounts: accounts.map(account => ({
          data: toAccountRaw(account),
          version: 1,
        })),
      },
    };
    console.log("App JSON created.");
    return JSON.stringify(jsondata);
  }

  const createProfile = () => {
    console.log("Creating profile...");
    if (newProfileName === "") return;
    const newProfile: ProfileInfos = {
      id: uuid(),
      name: newProfileName,
      description: newProfileDescription,
    };
    const updatedProfiles = [...profiles, newProfile];

    setKey("profiles", "list", updatedProfiles);
    setProfiles(updatedProfiles);

    console.log("userDataPath", userDataPath);

    fs.writeFileSync(`${userDataPath}/app_${newProfile.id}.json`, makeAppJSON([]));

    setNewProfileName("");
    setNewProfileDescription("");

    console.log("Profile created.");
  };

  const removeProfile = (id: string) => {
    console.log("Removing profile...");
    if (inUseId === id) return;
    const updatedProfiles = profiles.filter(profile => profile.id !== id);
    setKey("profiles", "list", updatedProfiles);
    setProfiles(updatedProfiles);

    const filePath = `${userDataPath}/app_${id}.json`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.log("Profile removed.");
  };

  const importProfile = useCallback(async () => {
    console.log("Importing profile...");
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

      const importedProfileInfos = {
        id: uuid(),
        name: data.name,
        description: data.description,
      };

      const updatedProfiles = [...(profiles || []), importedProfileInfos];

      fs.writeFileSync(`${userDataPath}/app_${importedProfileInfos.id}.json`, JSON.stringify(data));

      setKey("profiles", "list", updatedProfiles);
      // setKey("app", "profiles", {
      //   list: updatedProfiles,
      //   inUse: inUseId,
      // });
      setProfiles(updatedProfiles);

      // fs.writeFileSync(`${userDataPath}/app_${importedProfileInfos.id}.json`, JSON.stringify(data));
    }
    console.log("Profile imported.");
  }, [profiles, inUseId, userDataPath]);

  const switchProfile = (id: string) => {
    console.log("Switching profile...");
    setKey("profiles", "inUse", id);
    setInUseId(id);
    // NOTE: give enough time to debounched setKey to save the profile
    setTimeout(() => {
      ipcRenderer.send("app-reload");
    }, 2000);
    console.log("Profile switched.");
  };

  console.log("Returning hook values...");
  return {
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
  };
};

export default useProfile;