import { createCustomErrorClass } from "@ledgerhq/errors";

export const OsmosisWrongSignatureHeader = createCustomErrorClass(
  "OsmosisWrongSignatureHeader"
);

export const OsmosisSignatureSize = createCustomErrorClass(
  "OsmosisSignatureSize"
);

export const OsmosisErrorBroadcasting = createCustomErrorClass(
  "OsmosisErrorBroadcasting"
);
