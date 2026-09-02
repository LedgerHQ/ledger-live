// The details leaf imports its Figma-exported `*.svg` assets as URL strings (bundler
// `asset/resource`). This package is the first to compile that source across the package boundary,
// so it re-declares the ambient module here to keep `tsc` happy — mirroring
// `features/flow/pay-card-details/src/assets.d.ts`.
declare module "*.svg" {
  const src: string;
  export default src;
}

// The auth leaf imports its `*.webp` hero the same way, and this package compiles that source
// across the package boundary too — mirroring `features/flow/pay-card-auth/src/assets.d.ts`.
declare module "*.webp" {
  const src: string;
  export default src;
}
