import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import { useAddressActions } from "./useAddressActions";
import { AddressVerifyHint } from "./AddressVerifyHint";
import type {
  ReceiveAddressActionId,
  AddressVerifyHint as AddressVerifyHintProps,
} from "../../../types";

type AddressActionsProps = Readonly<{
  visibleActions: readonly ReceiveAddressActionId[];
  hasCopied: boolean;
  onShare: () => void;
  onCopy: () => void;
  isVerifyDisabled: boolean;
  onVerify: () => void;
  /** Every tile off: no address to act on yet. */
  disabled?: boolean;
  verifyHint?: AddressVerifyHintProps;
}>;

export function AddressActions(props: AddressActionsProps) {
  const { verifyHint } = props;
  const tiles = useAddressActions(props);

  return (
    <div className="flex w-full flex-row gap-8">
      {tiles.map(tile => {
        const button = (
          <TileButton
            icon={tile.icon}
            isFull
            disabled={props.disabled || tile.disabled}
            onClick={tile.onClick}
            data-testid={tile.testId}
          >
            {tile.label}
          </TileButton>
        );

        if (tile.id === "verify" && verifyHint) {
          return (
            <AddressVerifyHint key={tile.id} {...verifyHint}>
              {button}
            </AddressVerifyHint>
          );
        }

        return (
          <div key={tile.id} className="flex-1">
            {button}
          </div>
        );
      })}
    </div>
  );
}
