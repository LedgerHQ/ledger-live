import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";

export type CompareBackupMethodsFooterProps = {
  label: string;
  onPress: () => void;
};

export function CompareBackupMethodsFooter({
  label,
  onPress,
}: Readonly<CompareBackupMethodsFooterProps>) {
  return (
    <Button
      appearance="no-background"
      size="md"
      icon={ExternalLink}
      onPress={onPress}
      testID="backup-hub-compare-footer"
    >
      {label}
    </Button>
  );
}
