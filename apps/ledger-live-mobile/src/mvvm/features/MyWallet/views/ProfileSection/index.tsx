import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { UserAvatar } from "LLM/components/UserAvatar";

export function ProfileSection() {
  return (
    <Box lx={{ alignItems: "center", alignSelf: "stretch" }}>
      <UserAvatar size="xl" />
    </Box>
  );
}
