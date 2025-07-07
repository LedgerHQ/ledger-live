import React from "react";
import type { OperationType } from "@ledgerhq/types-live";
import type { HederaOperation } from "@ledgerhq/live-common/families/hedera/types";
import type { AddressCellProps } from "~/renderer/families/types";
import { Cell } from "~/renderer/components/OperationsList/AddressCell";
import Box from "~/renderer/components/Box";

const UpdateAccountAddressCell = ({ operation }: AddressCellProps<HederaOperation>) => {
  const memo = operation.extra.memo;

  if (!memo) {
    return null;
  }

  return (
    <Cell>
      <Box color="palette.text.shade80" ff="Inter" fontSize={3}>
        {memo}
      </Box>
    </Cell>
  );
};

const addressCell = {
  UPDATE_ACCOUNT: UpdateAccountAddressCell,
} satisfies Partial<Record<OperationType, unknown>>;

export default {
  addressCell,
};
