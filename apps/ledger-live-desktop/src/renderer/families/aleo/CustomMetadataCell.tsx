import React from "react";
import { AleoFamily } from "./types";
import { Box, Text } from "@ledgerhq/react-ui/index";
import { Trans } from "react-i18next";

const mapFunctionIdToName: Record<string, string> = {
  transfer_public: "aleo.operations.type.public",
  transfer_private: "aleo.operations.type.private",
  transfer_public_to_private: "aleo.operations.type.public_to_private",
  transfer_private_to_public: "aleo.operations.type.private_to_public",
};

const MyCustomMetadataCell: AleoFamily["CustomMetadataCell"] = props => {
  return (
    <Box width={90}>
      <Text color="neutral.c80" textAlign="center" display="block" variant="body" fontSize={3}>
        <Trans i18nKey={mapFunctionIdToName[props.operation.extra.functionId ?? "public"]} />
      </Text>
    </Box>
  );
};

export default MyCustomMetadataCell;
