import React, { useState } from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { DelegationDetailsSheet } from "../../internals/DelegationDetailsSheet";
import { DelegationsBody } from "../../internals/DelegationsBody";
import { DelegationsFooter } from "../../internals/DelegationsFooter";
import { DelegationsHeader } from "../../internals/DelegationsHeader";
import type { AccountDelegationsProps } from "./AccountDelegations.types";

export const AccountDelegations = (props: AccountDelegationsProps) => {
  const { title, rows, headerActions = [], footer, loading = false, testID } = props;
  const [selectedRowId, setSelectedRowId] = useState<string>();
  const selectedRow = rows.find(({ id }) => id === selectedRowId);
  const showFooter = footer !== undefined && !loading && rows.length > 0;

  const onSelectAction = (rowId: string, actionId: string) => {
    setSelectedRowId(undefined);
    props.onSelectRowAction(rowId, actionId);
  };

  return (
    <Box lx={{ gap: "s12" }} testID={testID}>
      <DelegationsHeader
        title={title}
        actions={headerActions}
        onSelectAction={props.onSelectHeaderAction}
        testID={testID}
      />
      <DelegationsBody {...props} onSelectRow={setSelectedRowId} />
      {showFooter ? (
        <DelegationsFooter
          footer={footer}
          onSelectAction={props.onSelectFooterAction}
          testID={testID}
        />
      ) : null}
      <DelegationDetailsSheet
        row={selectedRow}
        columns={props.columns}
        discreet={props.discreet ?? false}
        openValidatorLabel={props.openValidatorLabel}
        onOpenValidator={props.onOpenValidator}
        onSelectAction={onSelectAction}
        onClose={() => setSelectedRowId(undefined)}
        testID={testID ? `${testID}-sheet` : undefined}
      />
    </Box>
  );
};
