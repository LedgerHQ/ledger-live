import React from "react";
import { Avatar } from "@ledgerhq/lumen-ui-react";

export function UserAvatar() {
  return (
    <Avatar
      size="sm"
      aria-label="Avatar"
      data-testid="my-wallet-avatar"
      className="text-black dark:text-white"
    />
  );
}
