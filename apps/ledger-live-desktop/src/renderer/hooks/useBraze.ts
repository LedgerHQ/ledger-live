import { useEffect } from "react";
import * as braze from "@braze/web-sdk";

import { getBrazeConfig } from "~/braze-setup";

export function useBraze() {
  useEffect(() => {
    const brazeConfig = getBrazeConfig();
    braze.initialize(brazeConfig.apiKey, {
      baseUrl: brazeConfig.endpoint,
      enableLogging: true,
    });
    // braze.changeUser("7d44cb19-eab3-4f85-b1c8-9f79981a35da");
    console.log("IS PUSH SUPPORTED", braze.isPushSupported());
    braze.requestPushPermission(
      (endpoint, publicKey, userAuth) => {
        console.log("SUCCESS", { endpoint, publicKey, userAuth });
      },
      temporaryDenial => {
        console.log("NOT GRANTED - is temporary :", temporaryDenial);
      },
    );

    console.log("IS PERMISSION GRANTED :", braze.isPushPermissionGranted());
    braze.subscribeToContentCardsUpdates(function(cards) {
      // cards have been updated
      console.log("CARDS HAVE BEEN UPDATED", cards);
    });
    console.log("IAM subscription :", braze.automaticallyShowInAppMessages());
    console.log("TO Blocked?:", braze.isPushBlocked());
    braze.openSession();
  }, []);
}
