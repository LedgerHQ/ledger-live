import type { ReactNode } from "react";
import type { SpotProps } from "@ledgerhq/lumen-ui-rnative";
import type { InfoStateBaseProps } from "./sharedTypes";

export * from "./sharedTypes";

type LumenIconSpotProps = Extract<SpotProps, { appearance: "icon" }>;

/** Props forwarded to the Lumen Spot for the custom spot preset (native). */
export type InfoStateSpotProps = Pick<LumenIconSpotProps, "icon">;

/** Props for the native InfoState layout. */
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
