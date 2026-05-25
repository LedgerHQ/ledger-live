/**
 * Type declarations for RemoteApp federated module
 *
 * Add this declaration to your host app's types to get
 * proper TypeScript support when consuming this module.
 */

declare module "RemoteApp/HelloWorld" {
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

// Re-export for convenience
declare module "RemoteApp" {
  export * from "RemoteApp/HelloWorld";
}
