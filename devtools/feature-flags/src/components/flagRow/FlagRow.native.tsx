import {
  Switch,
  Box,
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { memo, useCallback } from "react";
import type { FeatureId } from "@shared/feature-flags";
import {
  useFeatureFlagsToolActions,
  useFeatureFlagsToolState,
} from "../../context/FeatureFlagsToolContext.native";
import { useFlagSelectionActions } from "../../context/FlagSelectionContext.native";
import { FlagEnableIndicator } from "../flagEnableIndicator/FlagEnableIndicator.native";

export interface FlagRowProps {
  readonly id: FeatureId;
}

const ITEM_LEADING_LX = { paddingHorizontal: "s8" } as const;
const ITEM_TRAILING_LX = { paddingHorizontal: "s8" } as const;
const ITEM_LX = { marginHorizontal: "-s8" } as const;
const BOX_LX_OVERRIDDEN = { backgroundColor: "activeSubtle" } as const;
const BOX_LX_NOT_OVERRIDDEN = { backgroundColor: "canvas" } as const;

function FlagRowComponent({ id }: FlagRowProps) {
  const { getFlagDisplayState } = useFeatureFlagsToolState();
  const { setOverride } = useFeatureFlagsToolActions();
  const { openFlag } = useFlagSelectionActions();
  const { resolved, isOverridden } = getFlagDisplayState(id);
  const handleSwitchChange = useCallback(
    (newValue: boolean) => {
      setOverride(id, { ...resolved, enabled: newValue });
    },
    [id, resolved, setOverride],
  );
  const handleRowPress = useCallback(() => {
    openFlag(id);
  }, [id, openFlag]);

  return (
    <Box lx={isOverridden ? BOX_LX_OVERRIDDEN : BOX_LX_NOT_OVERRIDDEN}>
      <ListItem onPress={handleRowPress} lx={ITEM_LX}>
        <ListItemLeading lx={ITEM_LEADING_LX}>
          <FlagEnableIndicator enabled={resolved.enabled} />
          <ListItemContent>
            <ListItemTitle>{id}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing lx={ITEM_TRAILING_LX}>
          <Switch checked={resolved.enabled} onCheckedChange={handleSwitchChange} />
        </ListItemTrailing>
      </ListItem>
    </Box>
  );
}

export const FlagRow = memo(FlagRowComponent);
