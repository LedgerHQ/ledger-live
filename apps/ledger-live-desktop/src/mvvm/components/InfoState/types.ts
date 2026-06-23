import type { ComponentProps, ReactNode } from "react";

type LumenSpotProps = ComponentProps<(typeof import("@ledgerhq/lumen-ui-react"))["Spot"]>;
type LumenIconSpotProps = Extract<LumenSpotProps, { icon?: unknown }>;

/** Preset that controls the visual rendered above the title and description. */
export type InfoStatePreset = "illustration" | "spot" | "success" | "error" | "info" | "text";

/** CTA displayed in the action stack below the content and optional banner. */
export type InfoStateCta = Readonly<{
  /** Button label. */
  label: ReactNode;

  /** Called when the button is pressed. */
  onPress: () => void;

  /** Optional test identifier forwarded to the button. */
  testID?: string;

  /** Whether the button is disabled. */
  disabled?: boolean;
}>;

/** Lumen banner displayed between content and actions. */
export type InfoStateBanner = Readonly<{
  /** Banner title. */
  title: string;

  /** Optional banner body copy. */
  description?: ReactNode;

  /** Visual treatment for the banner. Defaults to info. */
  appearance?: "info" | "warning" | "error" | "success";
}>;

/** Props forwarded to the Lumen Spot for the custom spot preset. */
export type InfoStateSpotProps = Pick<LumenIconSpotProps, "icon">;

type InfoStateBaseProps = Readonly<{
  /** Optional centered heading. */
  title?: ReactNode;

  /** Optional centered explanatory copy below the title. */
  description?: ReactNode;

  /** Primary action rendered first in the action stack. */
  primaryCta?: InfoStateCta;

  /** Secondary action rendered below the primary action. */
  secondaryCta?: InfoStateCta;

  /** Optional banner rendered before the action stack. */
  banner?: InfoStateBanner;

  /** Layout sizing mode. Full-height expands the content area. Defaults to full-height. */
  size?: "hug" | "full-height";

  /** Optional test identifier applied to the root container. */
  testID?: string;
}>;

/** Props for the shared desktop InfoState layout. */
export type InfoStateProps =
  | (InfoStateBaseProps & {
      /** Renders a caller-provided illustration in a 208px visual slot. */
      preset: "illustration";
      illustration: ReactNode;
    })
  | (InfoStateBaseProps & {
      /** Renders a Lumen Spot with caller-provided icon props. */
      preset: "spot";
      spotProps: InfoStateSpotProps;
    })
  | (InfoStateBaseProps & {
      /** Renders a success status Spot. */
      preset: "success";
    })
  | (InfoStateBaseProps & {
      /** Renders an error status Spot. */
      preset: "error";
    })
  | (InfoStateBaseProps & {
      /** Renders an info status Spot. */
      preset: "info";
    })
  | (InfoStateBaseProps & {
      /** Renders only title, description, banner, and actions without visual spacing. */
      preset: "text";
    });
