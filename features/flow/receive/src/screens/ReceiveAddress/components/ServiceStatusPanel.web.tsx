import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { ServiceStatusPanelProps } from "./ServiceStatusPanel.types";

/** The open incidents on the network, in the dialog. */
export function ServiceStatusPanel({ serviceStatus }: ServiceStatusPanelProps) {
  return (
    <div className="flex flex-col gap-24" data-testid="receive-address-service-status">
      <div className="flex flex-col gap-16">
        {serviceStatus.incidents.map(incident => (
          <div key={incident.title} className="flex flex-col gap-4">
            <span className="body-1-semi-bold text-base">{incident.title}</span>
            {incident.description ? (
              <span className="body-2 text-muted">{incident.description}</span>
            ) : null}
          </div>
        ))}
      </div>
      <Button appearance="base" isFull onClick={serviceStatus.onClose}>
        {serviceStatus.gotItLabel}
      </Button>
    </div>
  );
}
