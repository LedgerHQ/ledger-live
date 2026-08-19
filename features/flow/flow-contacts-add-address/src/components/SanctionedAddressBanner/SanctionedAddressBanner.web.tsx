import React from "react";
import { Banner, Button } from "@ledgerhq/lumen-ui-react";
import type { SanctionedAddressBannerProps } from "./types";

export const SanctionedAddressBanner = ({
  description,
  actionLabel,
  onAction,
  testID,
}: SanctionedAddressBannerProps): React.JSX.Element => (
  <Banner
    appearance="error"
    data-testid={testID ?? "contacts-sanctioned-address-banner"}
    description={description}
    primaryAction={
      <Button appearance="transparent" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    }
  />
);
