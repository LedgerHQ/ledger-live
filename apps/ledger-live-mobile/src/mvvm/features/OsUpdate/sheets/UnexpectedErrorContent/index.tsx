import React from "react";
import { ErrorContent } from "../ErrorContent";

export function UnexpectedErrorContent({ onCancel }: Readonly<{ onCancel: () => void }>) {
  return (
    <ErrorContent
      i18nKeyPrefix="osUpdates.unexpectedError"
      testID="os-update-unexpected-error"
      onCancel={onCancel}
    />
  );
}
