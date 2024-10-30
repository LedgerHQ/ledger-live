import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import { captureScreen } from "react-native-view-shot";
import { tabHistoryAtom } from "../db";
import { useSetAtom } from "jotai";

export const useCaptureTab = () => {
  const setTabHistory = useSetAtom(tabHistoryAtom);

  const captureTab = async (manifest?: AppManifest) => {
    if (!manifest) throw new Error("Manifest Absent");

    try {
      const uri = await captureScreen({
        format: "jpg",
        quality: 0.6,
        result: "data-uri",
      });

      const newTabEntry = {
        id: `${manifest.id}-${Math.ceil(Math.random() * 1000)}`,
        manifestId: manifest.id,
        title: manifest.name,
        icon: manifest.icon?.trim(),
        previewUri: uri,
        url: manifest.url,
      };

      setTabHistory(async state => {
        const s = await state;
        return [...s, newTabEntry];
      });
    } catch (error) {
      console.error("Failed to capture screen or save tab preview", error);
    }
  };

  return captureTab;
};
