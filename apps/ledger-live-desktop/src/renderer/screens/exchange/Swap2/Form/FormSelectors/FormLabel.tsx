import React from "react";
import Text from "~/renderer/components/Text";
export function FormLabel({ children }: { children?: React.ReactNode }) {
  return (
    <Text ff="Inter|Medium" color="palette.text.shade40">
      {children}
    </Text>
  );
}
