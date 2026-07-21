/**
 * Type declarations for the `swap` federated remote.
 *
 * The host imports this module as `swap/HelloWorld` (the MF container name is `swap`, see
 * `rspack.config.cjs`). Kept here as an explicit, reviewable contract; the MF toolchain also
 * emits `@mf-types` (producer `generateAPITypes`, host `consumeTypes.consumeAPITypes`).
 */

declare module "swap/HelloWorld" {
  import { FC } from "react";

  interface HelloWorldProps {
    /**
     * Optional name to display in the greeting
     * @default 'World'
     */
    name?: string;
  }

  const HelloWorld: FC<HelloWorldProps>;
  export default HelloWorld;
}
