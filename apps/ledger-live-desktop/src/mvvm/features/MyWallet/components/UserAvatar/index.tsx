import React from "react";
import { UserAvatarView } from "./UserAvatarView";
import { useUserAvatarViewModel } from "./useUserAvatarViewModel";
import { UserAvatarProps } from "./types";

export function UserAvatar(props: UserAvatarProps = {}) {
  const viewProps = useUserAvatarViewModel(props);

  return <UserAvatarView {...viewProps} />;
}
