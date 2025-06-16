import { defineConfig } from "tsup";

export default defineConfig(() => ({
  outDir: "lib",
  noExternal: [/^@ledgerhq/],
  // Packages that have pre-built binaries need to be included in the package.json of the project
  // and excluded from bundling via an "external"
  external: ["bigint-buffer", "buffer-to-arraybuffer", "usb", "node-hid"],
  target: "node18",
  formats: ["ESM"],
  clean: true,
  bundle: true,
  treeshake: false,
}));
