import React from "react";
import Text, { TextProps } from "~/renderer/components/Text";
const innerStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
  maxWidth: "100%",
  flexShrink: 1,
  display: "block" /** important for ellipsis to work */,
};

const Ellipsis = ({
  children,
  canSelect,
  ...p
}: {
  children: React.ReactNode;
  canSelect?: boolean;
} & TextProps) => (
  <Text
    {...p}
    style={{
      ...innerStyle,
      userSelect: canSelect ? "text" : "none",
    }}
  >
    {children}
  </Text>
);
export default Ellipsis;
