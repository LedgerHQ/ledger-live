import type { ComponentType, ReactNode } from "react";
import type { InfoStateBaseProps } from "./sharedTypes";

/** Status tone a custom spot can tint its enclosing dialog or bottom sheet with. */
export type InfoStateBackgroundTone = "error" | "info" | "success";

/** Diameter of the custom spot, in px. */
export type InfoStateSpotSize = 32 | 40 | 48 | 56 | 72;

/** Props forwarded to the Lumen Spot for the custom spot preset. */
export type InfoStateSpotProps = Readonly<{
  /** Lumen symbol of the caller's platform, rendered inside the spot. */
  icon: ComponentType;

  /** Defaults to 72. */
  size?: InfoStateSpotSize;
}>;

/** Props for the InfoState layout. */
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

      /**
       * Tints the enclosing dialog or bottom sheet. Only the custom spot preset can opt
       * in: the status presets already carry their own tone and the remaining presets
       * draw none.
       */
      backgroundTone?: InfoStateBackgroundTone;
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
