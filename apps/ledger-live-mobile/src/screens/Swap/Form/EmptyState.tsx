import React from "react";
import { Box, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";

const EmptyState = () => {
  const { t } = useTranslation();
  return (
    <Box alignItems={"center"}>
      <Text
        variant="body"
        color="neutral.c70"
        style={{
          textAlign: "center",
        }}
      >
        {t("transfer.swap2.form.providers.noProviders")}
      </Text>
    </Box>
  );
};

export default React.memo(EmptyState);
