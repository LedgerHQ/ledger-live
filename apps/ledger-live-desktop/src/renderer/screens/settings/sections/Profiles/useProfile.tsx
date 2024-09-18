import { app, ipcRenderer } from "electron";
import { useCallback, useEffect, useState } from "react";
import { getKey, setKey } from "~/renderer/storage";
import * as fs from "fs";
import { Account } from "@ledgerhq/types-live";
import { toAccountRaw } from "@ledgerhq/live-common/account/serialization";
import { v4 as uuid } from "uuid";
import { useLocation } from "react-router";

function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode(parseInt(p1, 16))
  }))
}

// Decoding base64 ⇢ UTF-8

function b64DecodeUnicode(str) {
  return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))
}

export type ProfileInfos = {
  id: string;
  name: string;
  description: string;
};

const useProfile = () => {
  const [settings, setSettings] = useState<any>({});
  const [newProfileName, setNewProfileName] = useState<string>("");
  const [newProfileDescription, setNewProfileDescription] = useState<string>("");
  const [newProfileTransferSettings, setNewProfileTransferSettings] = useState<boolean>(false);
  const [userDataPath, setUserDataPath] = useState<string>("");

  const [profiles, setProfiles] = useState<ProfileInfos[]>([]);
  const [inUseId, setInUseId] = useState<string>("");
  const location = useLocation();
  const [user, setUser] = useState<any>({});


  const userDataPathGetter = useCallback(
    async () => await ipcRenderer.invoke("getPathUserData"),
    [],
  );
  // throw new Error("OO")

  const initProfile = useCallback(async () => {
    console.log("Initializing profile...");

    const profilesFromStorage = await getKey("profiles", "list");
    const inUseFromStorage = await getKey("profiles", "inUse");
    const _userDataPath = await userDataPathGetter();
    setUserDataPath(_userDataPath);
    console.log({ initUserDataPath: userDataPath });

    const settingsFromStorage = await getKey("app", "settings");
    setSettings(settingsFromStorage);

    setProfiles(profilesFromStorage as ProfileInfos[]);
    setInUseId(inUseFromStorage as string);
    console.log({ inUseId, profilesFromStorage });
    console.log("Profile initialized.");
    

    // NOTE: used to identify shareable export
    const userFromStorage = await getKey("app", "user");
    setUser(userFromStorage);
    console.log({user})

  }, [inUseId]);

  useEffect(() => {
    initProfile();
    
  
  }, [initProfile]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const buffer = searchParams.get("buffer");
    const id = searchParams.get("id");
    console.log({location, id, buffer})
    if (!!id && !!buffer)
      importSharedProfile(id, buffer)
    // id = this format "shared_72eb8c4a-af16-4101-ae3b-a7aa81a203d7_"

  }, [location])
  const makeAppJSON = useCallback(
    (accounts: Account[]) => {
      console.log("Creating app JSON...");
      const newProfileSettings = newProfileTransferSettings
        ? settings
        : {
            hasCompletedOnboarding: true,
          };
      const jsondata = {
        data: {
          settings: newProfileSettings,
          accounts: accounts.map(account => ({
            data: toAccountRaw(account),
            version: 1,
          })),
        },
      };
      console.log("App JSON created.");
      return JSON.stringify(jsondata);
    },
    [newProfileTransferSettings, settings],
  );

  const createProfile = async () => {
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

    // NOTE: there's no need to create an app.json unless we're copying the current settings
    // it will be created once we switch to the new profile
    // still, it's useful to skip onboarding
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
  
  const importSharedProfile = useCallback(async (shareableId: string, content: string) => {
  const appJsonName = `app_${shareableId}.json`;


    // NOTE: cannot use userDataPath directly because it's not set yet when landing from deeplink
    const _userDataPath = await userDataPathGetter();
    if (!_userDataPath) {
      return
    }
    
    // NOTE: cannot use profiles directly because it's not set yet when landing from deeplink
    const _profilesFromStorage = await getKey("profiles", "list") as ProfileInfos[];


    const filePath = `${_userDataPath}/${appJsonName}`;
    console.log({filePath})

    if (fs.existsSync(filePath)) {
      console.warn(`App JSON already exists at ${filePath}`);
      return;
    }
    else {
      // const bufferFrom = Buffer.from(content, "base64")
      // const bufferFromStr = bufferFrom.toString();
      // const bufferFromStr = atob(content)
      // const decoded = b64DecodeUnicode(content);
      const decoded = decodeURIComponent(content);
      console.log({decoded})
      // const parsed = JSON.parse(bufferFromStr);
      const sharedProfileInfos = {
        id: shareableId,
        name: `shared profile ${shareableId}`,
        description: `shared profile`,
      };
      console.log({_profilesFromStorage})
      const updatedProfiles = [...(_profilesFromStorage || []), sharedProfileInfos];

      // TODO: could avoid parsing / stringifying the JSON
      console.log({filePath, decoded})
      fs.writeFileSync(filePath, decoded);// JSON.stringify(parsed));
      console.log({updatedProfiles, shareableId})
      setKey("profiles", "list", updatedProfiles);
      setProfiles(updatedProfiles);
      // NOTE: instaloading the profile would be nice, but buggy it seems.
      // setKey("profiles", "inUse", shareableId);
      // setTimeout(() => {
      //   ipcRenderer.send("app-reload");
      // }, 2000);
  
    }

  }, [userDataPath])

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
        // name: data.name, // NOTE: probably should use newProfileName instead
        // description: data.description, // NOTE: ditto ^
        name: newProfileName,
        description: newProfileDescription,
      };

      const updatedProfiles = [...(profiles || []), importedProfileInfos];

      fs.writeFileSync(`${userDataPath}/app_${importedProfileInfos.id}.json`, JSON.stringify(data));

      setKey("profiles", "list", updatedProfiles);
      setProfiles(updatedProfiles);
    }
    console.log("Profile imported.");
  }, [profiles, inUseId, userDataPath]);
  
  const shareProfile = useCallback(async (id: string) => {
    console.log("Getting app JSON...");
    let appJsonName = 'app.json';
    if (!!id) appJsonName = `app_${id}.json`;
    const filePath = `${userDataPath}/${appJsonName}`;
    if (fs.existsSync(filePath)) {
      const file = fs.readFileSync(filePath);
      // CAREFUL, FILE IS ENCRYPTED HERE
      console.log("App JSON gotten.");
      const parsed =  JSON.parse(file.toString());
      // const base64 = Buffer.from(JSON.stringify(parsed)).toString("base64");
      // const encoded = b64EncodeUnicode(JSON.stringify(parsed));
      // const fileContent = await readFile(filePath);
      // const { data } = JSON.parse(fileContent.toString());
      console.log({parsed})
  
      // const encoded = b64EncodeUnicode(file.toString());
      const encoded = encodeURIComponent(file.toString());
      
      const shareableId = `shared_${user.id}_${id}_${Date.now()}`;
      
      console.log(`ledgerlive://loadprofile?id=${shareableId}&buffer=${encoded}`)
      console.log({parsed, encoded})
    } else {
      console.log(`App JSON not found at ${filePath}`);
    }
  }, [userDataPath, user]);


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
    newProfileTransferSettings,
    setNewProfileName,
    setNewProfileDescription,
    setNewProfileTransferSettings,
    createProfile,
    removeProfile,
    importProfile,
    switchProfile,
    shareProfile,
  };
};

export default useProfile;
