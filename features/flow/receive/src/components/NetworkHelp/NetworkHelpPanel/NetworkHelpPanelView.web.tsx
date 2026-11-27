import React, { type MouseEvent } from "react";
import { Link } from "@ledgerhq/lumen-ui-react";
import { Trans } from "@shared/i18n";
import type { NetworkHelpPanelViewProps } from "./NetworkHelpPanelView.types";

export function NetworkHelpPanelView({ choose, testAmount, onOpenFaq }: NetworkHelpPanelViewProps) {
  const handleFaqClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onOpenFaq();
  };

  return (
    <div className="flex flex-col gap-24 pb-24 body-1 text-base" data-testid="receive-network-help">
      <p>{choose}</p>
      <p>{testAmount}</p>
      <p>
        <Trans
          i18nKey="receiveAddress.networkHelp.faq"
          components={[
            <Link
              key="faq"
              href="#"
              appearance="accent"
              size="inherit"
              underline={false}
              className="cursor-pointer"
              onClick={handleFaqClick}
            >
              {null}
            </Link>,
          ]}
        />
      </p>
    </div>
  );
}
