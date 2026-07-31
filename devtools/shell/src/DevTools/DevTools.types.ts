import { type ReactNode } from "react";
import { type DevToolsConfig } from "@devtools/registry";

/** Props common to every platform's DevTools entry. Platform entries extend this. */
export interface DevToolsBaseProps {
  readonly config?: DevToolsConfig;
  readonly footer?: ReactNode;
}
