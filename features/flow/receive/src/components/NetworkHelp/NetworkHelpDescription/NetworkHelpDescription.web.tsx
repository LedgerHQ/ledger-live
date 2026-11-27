import React, { type MouseEvent } from "react";
import { Link } from "@ledgerhq/lumen-ui-react";
import { Trans } from "@shared/i18n";
import type { NetworkHelpDescriptionProps } from "./NetworkHelpDescription.types";

/** Under "Select network" of the receive flow: which network to pick, with a link to the help. */
export function NetworkHelpDescription({ assetTicker, onLearnMore }: NetworkHelpDescriptionProps) {
  const handleLearnMoreClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onLearnMore();
  };

  return (
    <p className="body-2 text-muted" data-testid="receive-network-help-description">
      <Trans
        i18nKey="receiveAddress.networkHelp.description"
        values={{ asset: assetTicker }}
        components={[
          <Link
            key="learn-more"
            href="#"
            appearance="accent"
            size="inherit"
            underline={false}
            className="cursor-pointer"
            onClick={handleLearnMoreClick}
          >
            {null}
          </Link>,
        ]}
      />
    </p>
  );
}
