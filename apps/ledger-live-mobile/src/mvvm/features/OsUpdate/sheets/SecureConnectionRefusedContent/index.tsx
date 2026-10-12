import React from "react";
import { ErrorContent } from "../ErrorContent";

type SecureConnectionRefusedContentProps = Readonly<{
  onRetry: () => void;
  onCancel: () => void;
}>;

export function SecureConnectionRefusedContent({
  onRetry,
  onCancel,
}: SecureConnectionRefusedContentProps) {
  return (
    <ErrorContent
      i18nKeyPrefix="osUpdates.secureConnectionRefused"
      testID="os-update-secure-connection-refused"
      onCancel={onCancel}
      onRetry={onRetry}
    />
  );
}
