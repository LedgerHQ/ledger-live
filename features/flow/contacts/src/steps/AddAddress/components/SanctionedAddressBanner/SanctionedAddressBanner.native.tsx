import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-rnative";
import type { SanctionedAddressBannerProps } from "../../ContactsAddAddressEntry.types";

export function SanctionedAddressBanner({
  description,
  actionLabel,
  onAction,
  testID,
}: SanctionedAddressBannerProps): React.JSX.Element {
  return (
    <Banner
      testID={testID ?? "contacts-sanctioned-address-banner"}
      appearance="error"
      description={description}
      primaryAction={
        <Button appearance="transparent" size="sm" onPress={onAction}>
          {actionLabel}
        </Button>
      }
    />
  );
}
