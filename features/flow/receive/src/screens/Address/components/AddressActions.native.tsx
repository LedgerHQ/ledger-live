import React from "react";
import { Box, TileButton } from "@ledgerhq/lumen-ui-rnative";
import { useAddressActions } from "./useAddressActions";
import type { ReceiveAddressActionId } from "../../../types";

const VERIFY_LAYER = 2;

type AddressActionsProps = Readonly<{
  visibleActions: readonly ReceiveAddressActionId[];
  hasCopied: boolean;
  onShare: () => void;
  onCopy: () => void;
  isVerifyDisabled: boolean;
  onVerify: () => void;
  /** Every tile off: no address to act on yet. */
  disabled?: boolean;
  dimOtherActions?: boolean;
}>;

export function AddressActions(props: AddressActionsProps) {
  const { dimOtherActions } = props;
  const tiles = useAddressActions(props);

  return (
    <Box lx={{ flexDirection: "row", gap: "s8", width: "full" }}>
      {tiles.map(tile => {
        const isVerify = tile.id === "verify";
        const isDisabled = props.disabled || tile.disabled || (!!dimOtherActions && !isVerify);
        return (
          <Box
            key={tile.id}
            lx={{ flex: 1 }}
            style={dimOtherActions && isVerify ? { zIndex: VERIFY_LAYER } : undefined}
          >
            <TileButton
              lx={{ width: "full" }}
              icon={tile.icon}
              onPress={isDisabled ? undefined : tile.onClick}
              disabled={isDisabled}
              testID={tile.testId}
              accessibilityLabel={tile.label}
              isFull
            >
              {tile.label}
            </TileButton>
          </Box>
        );
      })}
    </Box>
  );
}
