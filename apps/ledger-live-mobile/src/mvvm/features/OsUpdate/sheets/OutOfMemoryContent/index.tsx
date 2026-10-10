import React from "react";
import { ErrorContent } from "../ErrorContent";

export function OutOfMemoryContent({ onCancel }: Readonly<{ onCancel: () => void }>) {
  return (
    <ErrorContent
      i18nKeyPrefix="osUpdates.outOfMemory"
      testID="os-update-out-of-memory"
      onCancel={onCancel}
    />
  );
}
