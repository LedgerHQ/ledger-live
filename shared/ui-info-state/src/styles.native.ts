import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";

const baseRootStyle: LumenViewStyle = {
  width: "full",
};

export const rootStyle = (isFullHeight: boolean): LumenViewStyle =>
  isFullHeight
    ? {
        ...baseRootStyle,
        flex: 1,
      }
    : baseRootStyle;

const baseInfoStateStyle: LumenViewStyle = {
  gap: "s32",
  paddingVertical: "s24",
  width: "full",
};

export const infoStateStyle = (isFullHeight: boolean): LumenViewStyle =>
  isFullHeight
    ? {
        ...baseInfoStateStyle,
        flex: 1,
        minHeight: "s480",
      }
    : baseInfoStateStyle;

export const contentStyle = (isFullHeight: boolean, isTextPreset: boolean): LumenViewStyle => ({
  alignItems: "center",
  flex: isFullHeight ? 1 : undefined,
  gap: isTextPreset ? "s0" : "s24",
  justifyContent: "center",
  width: "full",
});

export const titleDescriptionStyle: LumenViewStyle = {
  alignItems: "center",
  gap: "s8",
  width: "full",
};

export const fullWidthStyle: LumenViewStyle = {
  width: "full",
};

export const actionsStyle: LumenViewStyle = {
  gap: "s16",
  width: "full",
};

export const illustrationSlotStyle: LumenViewStyle = {
  alignItems: "center",
  borderRadius: "sm",
  height: "s208",
  justifyContent: "center",
  overflow: "hidden",
  width: "s208",
};
