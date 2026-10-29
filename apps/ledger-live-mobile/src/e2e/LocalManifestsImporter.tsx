import { useEffect } from "react";
import { useLocalLiveAppContext } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { e2eBridgeClient, sendLocalManifestsImported } from "~/e2e/bridge/client";

/**
 * Adds the manifests sent over the e2e bridge (`importLocalManifests`) as local live apps,
 * which take precedence over the catalog manifest with the same id.
 */
export function LocalManifestsImporter() {
  const { addLocalManifest } = useLocalLiveAppContext();

  useEffect(() => {
    const subscription = e2eBridgeClient.subscribe(msg => {
      if (msg.type !== "importLocalManifests") return;
      msg.payload.forEach(addLocalManifest);
      sendLocalManifestsImported(
        msg.id,
        msg.payload.map(({ id }) => id),
      );
    });
    return () => subscription.unsubscribe();
  }, [addLocalManifest]);

  return null;
}
