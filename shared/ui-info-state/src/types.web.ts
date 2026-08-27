import type { ComponentProps, ReactNode } from "react";
import type { Spot } from "@ledgerhq/lumen-ui-react";
import type { DialogBackgroundTone } from "./background/DialogBackgroundContext.web";
import type { InfoStateBaseProps } from "./sharedTypes";

export * from "./sharedTypes";

type LumenSpotProps = ComponentProps<typeof Spot>;
type LumenIconSpotProps = Extract<LumenSpotProps, { icon?: unknown }>;

/** Props forwarded to the Lumen Spot for the custom spot preset (web). */
export type InfoStateSpotProps = Pick<LumenIconSpotProps, "icon" | "size">;

type InfoStateWebBaseProps = InfoStateBaseProps &
  Readonly<{
    /** Optional full-width custom content rendered between the copy and the banner. Web only. */
    content?: ReactNode;
  }>;

/** Props for the web InfoState layout. */
export type InfoStateProps =
  | (InfoStateWebBaseProps & {
      /** Renders a caller-provided illustration in a 208px visual slot. */
      preset: "illustration";
      illustration: ReactNode;
    })
  | (InfoStateWebBaseProps & {
      /** Renders a Lumen Spot with caller-provided icon props. */
      preset: "spot";
      spotProps: InfoStateSpotProps;

      /**
       * Tints the dialog with a status gradient. Only the custom spot preset can opt
       * in: the status presets already carry their own tone and the remaining presets
       * draw none.
       */
      backgroundTone?: DialogBackgroundTone;
    })
  | (InfoStateWebBaseProps & {
      /** Renders a success status Spot. */
      preset: "success";
    })
  | (InfoStateWebBaseProps & {
      /** Renders an error status Spot. */
      preset: "error";
    })
  | (InfoStateWebBaseProps & {
      /** Renders an info status Spot. */
      preset: "info";
    })
  | (InfoStateWebBaseProps & {
      /** Renders only title, description, banner, and actions without visual spacing. */
      preset: "text";
    });
