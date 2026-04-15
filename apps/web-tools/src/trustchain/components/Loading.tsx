import React from "react";
import { Spinner } from "@ledgerhq/lumen-ui-react";

export function Loading() {
  return (
    <div className="flex items-center gap-10 p-10">
      <Spinner size={12} />
      <span className="body-2 text-muted">Loading...</span>
    </div>
  );
}
