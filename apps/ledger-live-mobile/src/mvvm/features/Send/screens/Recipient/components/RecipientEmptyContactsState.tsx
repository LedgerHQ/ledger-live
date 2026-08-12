import { Box, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { Contact } from "@ledgerhq/lumen-ui-rnative/symbols";
import React from "react";
import { useTranslation } from "~/context/Locale";

export function RecipientEmptyContactsState() {
  const { t } = useTranslation();

  return (
    <Box
      lx={{
        alignItems: "center",
        gap: "s24",
        paddingHorizontal: "s16",
        paddingVertical: "s48",
      }}
      testID="send-recipient-empty-contacts-state"
    >
      <Spot appearance="icon" icon={Contact} size={72} />
      <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
        {t("send.newSendFlow.contactsWillAppear")}
      </Text>
    </Box>
  );
}
