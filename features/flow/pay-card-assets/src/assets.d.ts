// Auth's login intro imports a `*.webp`. This package is first to compile that source across the
// package boundary, so it re-declares the ambient module here to keep `tsc` happy — mirroring
// `features/flow/pay-card/src/assets.d.ts`.
declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}
