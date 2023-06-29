import React from "react";
import { Box, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";

type Props = {
  from: string;
  to: string;
};
const EmptyState: React.FC<Props> = ({ from, to }) => {
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
        {t("transfer.swap2.form.providers.noProviders", {
          from,
          to,
        })}
      </Text>
    </Box>
  );
};

export default React.memo(EmptyState);
