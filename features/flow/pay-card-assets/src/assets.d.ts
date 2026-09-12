// Auth leaf imports `*.webp` as URL strings. This package compiles that source across the
// package boundary, so it re-declares the ambient module here — mirroring
// `features/flow/pay-card/src/assets.d.ts`.
declare module "*.webp" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}
