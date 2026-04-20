import type { ComponentProps } from "react";
import type { TileButton } from "@ledgerhq/lumen-ui-react";

export type Action = {
  icon: ComponentProps<typeof TileButton>["icon"];
  label: string;
  onClick?: () => void;
};
