import React from "react";
import { Text, Alert } from "@ledgerhq/react-ui";

type Props = { error: Error };

export function AlertError({ error }: Props) {
  return (
    <Alert
      type={"error"}
      containerProps={{ p: 12, borderRadius: 8 }}
      renderContent={() => (
        <Text
          variant="paragraphLineHeight"
          fontWeight="semiBold"
          color="neutral.c100"
          fontSize={13}
        >
          {error.message}
        </Text>
      )}
    />
  );
}
