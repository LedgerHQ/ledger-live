export type Layer = "shared" | "domain-entity" | "domain-api" | "feature-platform" | "feature-flow";

export type Platform = "logic" | "web" | "native" | "dual";

export interface PackageGeneratorSchema {
  name: string;
  layer: Layer;
  platform: Platform;
  description?: string;
  skipFormat?: boolean;
}
