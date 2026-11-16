import {
  Box,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { memo } from "react";
import type { KeyDisplayState } from "../../types";
import { Pill } from "../pill/Pill";

export interface KeyRowProps {
  readonly display: KeyDisplayState;
  readonly onSelect: (key: string) => void;
}

const BOX_LX_OVERRIDDEN = { backgroundColor: "activeSubtle", paddingHorizontal: "s4" } as const;
const BOX_LX_NOT_OVERRIDDEN = { backgroundColor: "canvas", paddingHorizontal: "s4" } as const;

function KeyRowComponent({ display, onSelect }: KeyRowProps) {
  const { key, valueType, isOverridden } = display;
  return (
    <Box lx={isOverridden ? BOX_LX_OVERRIDDEN : BOX_LX_NOT_OVERRIDDEN}>
      <ListItem onPress={() => onSelect(key)}>
        <ListItemLeading>
          <Pill variant="muted" size={4}>
            {valueType}
          </Pill>
          <ListItemContent>
            <ListItemTitle>{key}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        {isOverridden && (
          <ListItemTrailing>
            <Pill variant="active" size={4}>
              Overridden
            </Pill>
          </ListItemTrailing>
        )}
      </ListItem>
    </Box>
  );
}

export const KeyRow = memo(KeyRowComponent);
