import React from "react";
import { Trans } from "react-i18next";
import { Box, Text } from "@ledgerhq/react-ui/index";
import type { AleoTransactionType } from "@ledgerhq/live-common/families/aleo/types";
import type { AleoFamily } from "./types";

const mapFunctionIdToName: Record<AleoTransactionType, string> = {
  public: "aleo.operations.type.public",
  private: "aleo.operations.type.private",
};

const CustomMetadataCell: AleoFamily["CustomMetadataCell"] = props => {
  return (
    <Box width={90}>
      <Text color="neutral.c80" textAlign="center" display="block" variant="body" fontSize={3}>
        <Trans i18nKey={mapFunctionIdToName[props.operation.extra.transactionType]} />
      </Text>
    </Box>
  );
};

export default CustomMetadataCell;
