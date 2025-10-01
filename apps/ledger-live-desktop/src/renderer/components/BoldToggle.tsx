import React from "react";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
type Props = {
  ff?: string;
  ffBold?: string;
  isBold: boolean;
  children: React.ReactNode;
};
function BoldToggle({ ff = "Inter", ffBold = "Inter|SemiBold", isBold, children }: Props) {
  return (
    <Box relative>
      <Text
        ff={ffBold}
        style={{
          opacity: isBold ? 1 : 0,
        }}
      >
        {children}
      </Text>
      {!isBold && (
        <Box sticky alignItems="center" justifyContent="center">
          <Text ff={ff}>{children}</Text>
        </Box>
      )}
    </Box>
  );
}
export default BoldToggle;
