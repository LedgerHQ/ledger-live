import React, { useMemo, memo } from "react";
import { Text } from "@ledgerhq/native-ui";
import { BaseTextProps } from "@ledgerhq/native-ui/components/Text/index";
import { FontWeightTypes } from "@ledgerhq/native-ui/components/Text/getTextStyle";
import getFontStyle from "./getFontStyle";

export { getFontStyle };

export type Opts = Omit<BaseTextProps, "children"> & {
  bold?: boolean;
  semiBold?: boolean;
  secondary?: boolean;
  monospace?: boolean;
  color?: string;
  bg?: string;
  fontSize?: string;
  children?: React.ReactNode;
  variant?: string;
  fontFamily?: string;
};

export type Res = {
  fontFamily: string;
  fontWeight:
    | "normal"
    | "bold"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900";
};

const inferFontWeight = ({
  semiBold,
  bold,
}: Partial<Opts>): FontWeightTypes => {
  if (bold) {
    return "bold";
  }
  if (semiBold) {
    return "semiBold";
  }
  return "medium";
};

/**
 * This component is just a proxy to the Text component defined in @ledgerhq/native-ui.
 * It should only be used to map legacy props/logic from LLM to the new text component.
 *
 * @deprecated Please, prefer using the Text component from our design-system if possible.
 */
function LText({ color, children, semiBold, bold, ...props }: Opts) {
  const fontWeight = useMemo(
    () => inferFontWeight({ semiBold, bold }),
    [semiBold, bold],
  );

  return (
    <Text {...props} fontWeight={fontWeight} color={color}>
      {children}
    </Text>
  );
}

export default memo<Opts>(LText);
