import React from "react";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { Trans } from "react-i18next";
function EmptyState() {
  return (
    <Box alignItems={"center"}>
      <Text
        ff="Inter|Medium"
        color="palette.text.shade50"
        style={{
          justifyContent: "flex-end",
          width: "315px",
          textAlign: "center",
          marginTop: "24px",
        }}
        fontSize={4}
      >
        <Trans i18nKey="swap.providers.noProviders" />
      </Text>
    </Box>
  );
}
export default React.memo<Props>(EmptyState);
