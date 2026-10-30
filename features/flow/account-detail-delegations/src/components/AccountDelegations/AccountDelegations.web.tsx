import React from "react";
import { DelegationsBody } from "../../internals/DelegationsBody";
import { DelegationsFooter } from "../../internals/DelegationsFooter";
import { DelegationsHeader } from "../../internals/DelegationsHeader";
import type { AccountDelegationsProps } from "./AccountDelegations.types";

export const AccountDelegations = (props: AccountDelegationsProps) => {
  const { title, rows, headerActions = [], footer, loading = false, testID } = props;
  const showFooter = footer !== undefined && !loading && rows.length > 0;

  return (
    <section className="flex flex-col gap-12" data-testid={testID}>
      <DelegationsHeader
        title={title}
        actions={headerActions}
        onSelectAction={props.onSelectHeaderAction}
        testID={testID}
      />
      <DelegationsBody {...props} />
      {showFooter ? (
        <DelegationsFooter
          footer={footer}
          onSelectAction={props.onSelectFooterAction}
          testID={testID}
        />
      ) : null}
    </section>
  );
};
