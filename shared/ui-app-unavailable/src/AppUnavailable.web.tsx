import React from "react";
import { Button, Spot } from "@ledgerhq/lumen-ui-react";
import { ExternalLink, Globe } from "@ledgerhq/lumen-ui-react/symbols";
import { CONTENT_MAX_WIDTH_PX, SPOT_SIZE } from "./internals/layout";
import type { AppUnavailableProps } from "./AppUnavailable.types";

export function AppUnavailable({ title, description, action, testID }: AppUnavailableProps) {
  return (
    <div
      className="bg-canvas flex h-full w-full flex-1 items-center justify-center px-16"
      data-testid={testID}
    >
      <div
        className="flex w-full flex-col items-center gap-32"
        style={{ maxWidth: CONTENT_MAX_WIDTH_PX }}
      >
        <div className="flex w-full flex-col items-center gap-24">
          <Spot icon={Globe} size={SPOT_SIZE} />
          <div className="flex w-full flex-col items-center gap-8 text-center">
            <h1 className="heading-4-semi-bold text-base">{title}</h1>
            <p className="body-2 text-muted">{description}</p>
          </div>
        </div>
        {action ? (
          <Button
            appearance="gray"
            icon={ExternalLink}
            onClick={action.onOpenLearnMore}
            data-testid={action.testID}
            size="lg"
          >
            {action.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
