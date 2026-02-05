import React from "react";
import { UploadCustomLockScreenDAState } from "@ledgerhq/dmk-ledger-wallet";
import { Flex, Text } from "@ledgerhq/native-ui";

interface Props {
  deviceActionState: UploadCustomLockScreenDAState;
}

export const UploadCLS: React.FC<Props> = ({ deviceActionState }) => {
  // ERRORS:
  // TODO: render generic error UI
  // TODO: render retry button with analytics and text
  // TODO: if refusedOnDevice, render do this later button with analytics and text

  // LOADING:
  // TODO: render load requested UI
  // TODO: render loading image UI with progress

  // COMMITTING:
  // TODO: render committing UI

  // DEFAULT RENDERING:
  // TODO: render device locked UI

  return (
    <Flex>
      <Text>{"Upload Custom Lock Screen"}</Text>
      <Text>{JSON.stringify(deviceActionState, null, 2)}</Text>
    </Flex>
  );
};
