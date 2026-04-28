import { AvatarProps } from "@ledgerhq/lumen-ui-react";
export type UserAvatarViewProps = {
  showNotification: boolean;
  unseenCount: number;
  size?: AvatarProps["size"];
};

export type UserAvatarProps = Partial<UserAvatarViewProps>;
