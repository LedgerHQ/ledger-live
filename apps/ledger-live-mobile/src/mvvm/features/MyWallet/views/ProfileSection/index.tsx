import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { UserAvatar } from "../../components/UserAvatar";

export function ProfileSection() {
  return (
    <Box lx={{ alignItems: "center" }}>
      <UserAvatar size="xl" />
    </Box>
  );
}
