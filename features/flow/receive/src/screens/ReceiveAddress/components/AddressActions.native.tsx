import React from "react";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Box, Button, Text, TileButton } from "@ledgerhq/lumen-ui-rnative";
import { Check, Copy, Share, ShieldCheck } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { AddressActionsProps } from "./AddressActions.types";

const HINT_ENTER_MS = 220;
const HINT_WIDTH = 256;
// Over the dimmed screen: the hint and the Verify tile.
const FRONT_LAYER = 2;

type Tile = Readonly<{
  id: "share" | "copy" | "verify";
  icon: typeof Copy;
  label: string;
  onPress: () => void;
  disabled: boolean;
}>;

/** Share, Copy and Verify tiles; the verify hint points at Verify and dims the other tiles. */
export function AddressActions({ actions }: AddressActionsProps) {
  const { disabled, share, copy, verify, verifyHint } = actions;
  const isHintOpen = !!verifyHint;

  const tiles: Tile[] = [];
  if (share) tiles.push({ id: "share", icon: Share, ...share, disabled });
  if (copy) tiles.push({ id: "copy", icon: copy.hasCopied ? Check : Copy, ...copy, disabled });
  if (verify) {
    tiles.push({
      id: "verify",
      icon: ShieldCheck,
      ...verify,
      disabled: disabled || verify.disabled,
    });
  }

  return (
    <Box>
      {verifyHint ? (
        <Animated.View
          entering={FadeInUp.duration(HINT_ENTER_MS)}
          testID="receive-address-verify-hint"
          style={{
            position: "absolute",
            right: 0,
            bottom: "100%",
            width: HINT_WIDTH,
            zIndex: FRONT_LAYER,
          }}
        >
          <Box
            lx={{
              gap: "s12",
              backgroundColor: "surface",
              borderRadius: "md",
              padding: "s16",
              marginBottom: "s8",
            }}
          >
            <Text typography="body2" lx={{ color: "base" }}>
              {verifyHint.message}
            </Text>
            <Box lx={{ alignItems: "flex-end" }}>
              <Button size="sm" onPress={verifyHint.onGotIt}>
                {verifyHint.gotItLabel}
              </Button>
            </Box>
          </Box>
        </Animated.View>
      ) : null}
      <Box lx={{ flexDirection: "row", gap: "s8", width: "full" }}>
        {tiles.map(tile => {
          const isVerify = tile.id === "verify";
          const isDisabled = tile.disabled || (isHintOpen && !isVerify);
          return (
            <Box
              key={tile.id}
              lx={{ flex: 1 }}
              style={isHintOpen && isVerify ? { zIndex: FRONT_LAYER } : undefined}
            >
              <TileButton
                lx={{ width: "full" }}
                icon={tile.icon}
                onPress={isDisabled ? undefined : tile.onPress}
                disabled={isDisabled}
                testID={`receive-address-${tile.id}`}
                accessibilityLabel={tile.label}
                isFull
              >
                {tile.label}
              </TileButton>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
