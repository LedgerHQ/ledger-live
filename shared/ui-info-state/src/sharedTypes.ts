import type { ReactNode } from "react";

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

/** Props shared by every preset, on every platform. */
export type InfoStateBaseProps = Readonly<{
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

  /** Optional body below the title, used for structured content like next-step lists. */
  content?: ReactNode;
}>;
