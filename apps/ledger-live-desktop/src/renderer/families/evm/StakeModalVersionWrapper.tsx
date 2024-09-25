import StakeFlowModal_deprecated from "./StakeFlowModal_deprecated";
import { StakeModal, Props } from "./StakeFlowModal";
import React, { useEffect, useState } from "react";
import * as braze from "@braze/web-sdk";

export default function StakeModalVersionWrapper(props: Props) {
  const [useLatest, setUseLatest] = useState(false);

  useEffect(() => {
    (async () => {
      const x = await braze.getFeatureFlag("earn-use-latest-stake-modal");
      console.log({ x });
      setUseLatest(Boolean(x.enabled));
    })();
  }, []);

  return useLatest ? <StakeModal {...props} /> : <StakeFlowModal_deprecated {...props} />;
}
