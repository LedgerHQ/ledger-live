import React from "react";
import { Trans } from "react-i18next";
import { Box, Text } from "@ledgerhq/react-ui/index";
import type { AleoTransactionType } from "@ledgerhq/live-common/families/aleo/types";
import type { AleoFamily } from "./types";

type OperationDetails = NonNullable<AleoFamily["operationDetails"]>;

const mapFunctionIdToTranslationKey: Record<AleoTransactionType, string> = {
  public: "aleo.operations.type.public",
  private: "aleo.operations.type.private",
};

const CustomMetadataCell: OperationDetails["customMetadataCell"] = props => {
  const transactionType = props.operation.extra.transactionType;
  const translationKey = mapFunctionIdToTranslationKey[transactionType];

  if (!translationKey) {
    return null;
  }

  return (
    <Box width={90} data-testid="custom-metadata-cell">
      <Text color="neutral.c80" textAlign="center" display="block" variant="body" fontSize={3}>
        <Trans i18nKey={translationKey} />
      </Text>
    </Box>
  );
};

export default {
  customMetadataCell: CustomMetadataCell,
};
