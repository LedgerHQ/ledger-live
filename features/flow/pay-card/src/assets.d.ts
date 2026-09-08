// The details leaf imports its Figma-exported `*.svg` assets as URL strings (bundler
// `asset/resource`). This package is the first to compile that source across the package boundary,
// so it re-declares the ambient module here to keep `tsc` happy — mirroring
// `features/flow/pay-card-details/src/assets.d.ts`.
declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}
