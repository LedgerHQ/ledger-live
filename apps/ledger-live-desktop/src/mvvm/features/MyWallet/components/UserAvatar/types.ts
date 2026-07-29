import { ComponentPropsWithRef } from "react";
import { AvatarProps } from "@ledgerhq/lumen-ui-react";

type UserAvatarButtonProps = Omit<ComponentPropsWithRef<"button">, "children">;

export type UserAvatarProps = {
  showNotification?: boolean;
  unseenCount?: number;
  size?: AvatarProps["size"];
  /** When true, renders an interactive `AvatarButton` and forwards the button props below. */
  interactive?: boolean;
} & UserAvatarButtonProps;

export type UserAvatarViewProps = Omit<UserAvatarProps, "showNotification" | "unseenCount"> & {
  showNotification: boolean;
  unseenCount: number;
};
