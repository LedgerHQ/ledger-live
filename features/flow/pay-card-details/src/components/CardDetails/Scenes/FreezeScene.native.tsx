import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { ConfirmError } from "../../Freeze/Confirm/ConfirmError";
import { ConfirmPrompt } from "../../Freeze/Confirm/ConfirmPrompt";
import type { FreezeSceneProps } from "./types";

export function FreezeScene({ viewModel }: FreezeSceneProps) {
  if (viewModel.confirmState === "closed") {
    return null;
  }

  const isPending = viewModel.confirmState === "pending";

  return (
    <Box testID="card-details-freeze-content">
      {viewModel.confirmState === "error" ? (
        <ConfirmError
          status={viewModel.status}
          onConfirm={viewModel.onConfirm}
          onClose={viewModel.onClose}
        />
      ) : (
        <ConfirmPrompt
          status={viewModel.status}
          isPending={isPending}
          onConfirm={viewModel.onConfirm}
          onClose={viewModel.onClose}
        />
      )}
    </Box>
  );
}
