import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { captureScreen } from "react-native-view-shot";
import deviceStorage from "~/logic/storeWrapper";
import { Web3HubTabType } from "../screens/Web3HubTabs/components/TabItem";

export const captureTab = async (manifest: AppManifest | undefined) => {
  try {
    if (!manifest) throw new Error("Manifest Absent");

    const uri = await captureScreen({
      format: "jpg",
      quality: 0.6,
    });

    let tabHistory = (await deviceStorage.get("web3hubTabHistory")) as Web3HubTabType[];

    if (!tabHistory || Object.keys(tabHistory).length === 0) {
      tabHistory = [];
    }

    tabHistory = [
      ...tabHistory,
      {
        id: manifest.id + Math.ceil(Math.random() * 1000),
        manifestId: manifest.id,
        title: manifest.name,
        icon: manifest.icon?.trim(),
        previewUri: uri,
        url: manifest.url,
      },
    ];

    deviceStorage.save("web3hubTabHistory", tabHistory);
  } catch (error) {
    console.error("Failed to capture screen or save tab preview", error);
  }
};
