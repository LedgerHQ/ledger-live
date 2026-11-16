import React from "react";
import { Button, DialogBody, DialogFooter, Spinner } from "@ledgerhq/lumen-ui-react";
import type { StakePositionUnavailableViewProps } from "./StakePositionUnavailableView.types";

export function StakePositionUnavailableView(props: StakePositionUnavailableViewProps) {
  if (props.reason === "loading") {
    return (
      <DialogBody data-testid={props.testID}>
        <div className="flex flex-col items-center gap-16 py-24">
          <Spinner size={40} />
          <p className="body-2 text-muted">{props.text}</p>
        </div>
      </DialogBody>
    );
  }

  return (
    <>
      <DialogBody data-testid={props.testID}>
        <div className="flex flex-col gap-8">
          <h3 className="heading-4-semi-bold text-base">{props.title}</h3>
          <p className="body-2 text-muted">{props.description}</p>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button appearance="gray" size="lg" isFull onClick={props.onDismiss}>
          {props.closeLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
