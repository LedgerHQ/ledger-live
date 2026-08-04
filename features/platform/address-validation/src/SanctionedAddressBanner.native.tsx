import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-rnative";
import type { SanctionedAddressBannerProps } from "./types";

export function SanctionedAddressBanner({
  title,
  description,
  actionLabel,
  onAction,
  testID,
}: SanctionedAddressBannerProps): React.JSX.Element {
  return (
    <Banner
      appearance="error"
      title={title}
      description={description}
      primaryAction={
        <Button appearance="transparent" size="sm" onPress={onAction}>
          {actionLabel}
        </Button>
      }
      testID={testID}
    />
  );
}
