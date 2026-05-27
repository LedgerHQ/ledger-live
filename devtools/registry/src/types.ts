import { ComponentType, LazyExoticComponent } from "react";
import { z } from "zod";

/**
 * Canonical list of categories tools can be grouped under in the DevTools UI.
 */
export const Category = {
  CONFIGURATION: "Configuration",
  FEATURES_AND_FLOWS: "Features & flows",
  CONNECTIVITY: "Connectivity",
  GENERATORS: "Generators",
  DEBUGGING: "Debugging",
  INFORMATION: "Information",
  PERFORMANCE: "Performance",
  PLAYGROUND: "Playground",
} as const;

/** Utility: extracts the union of value types from an object type. */
export type ValueOf<T> = T[keyof T];

/** A category label, narrowed to one of the values of {@link Category}. */
export type Category = ValueOf<typeof Category>;

/** Stable identifier for a registered tool (matches the key in `tools`). */
export type ToolId = string;

/**
 * Runtime schema describing the metadata every tool must declare in the registry.
 *
 * Source of truth for {@link ToolMetadata}; keep schema and type in sync via `z.infer`.
 */
export const ToolMetadataSchema = z.object({
  label: z.string().min(1),
  category: z.enum(Category),
  owner: z.string().optional(),
  desc: z.string().optional(),
  icon: z.string().optional(),
  platform: z.enum(["web", "native"]).optional(),
});

/**
 * Dynamic-import loader for a tool's React component.
 *
 * Enables lazy loading: each tool's code is fetched only when it's first opened.
 *
 * @typeParam Props - Props expected by the tool's default-exported component.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolLoader<Props = any> = () => Promise<{ default: ComponentType<Props> }>;

/**
 * Static metadata for a registered tool — what the registry stores per id.
 *
 * Combines the validated schema fields with a {@link ToolLoader} so the
 * shell can resolve and render the tool component on demand.
 */
export type ToolMetadata = z.infer<typeof ToolMetadataSchema> & {
  loader: ToolLoader;
};

/** Platforms a tool can target. Defaults to "both" when unspecified on metadata. */
export type ToolPlatform = NonNullable<ToolMetadata["platform"]>;

/**
 * Resolved tool ready to be rendered by the shell: metadata + concrete component.
 *
 * Produced inside the shell by combining a {@link ToolId}, its {@link ToolMetadata}
 * and the lazily loaded component returned by `loader`.
 *
 * @typeParam Props - Props expected by the tool's component.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Tool<Props = any> extends z.infer<typeof ToolMetadataSchema> {
  id: ToolId;
  component: ComponentType<Props> | LazyExoticComponent<ComponentType<Props>>;
}
