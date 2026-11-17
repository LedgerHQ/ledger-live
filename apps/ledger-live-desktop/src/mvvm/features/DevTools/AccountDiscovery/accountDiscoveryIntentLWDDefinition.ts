import {
  accountDiscoveryIntentDefinition,
  type AccountDiscoveryIntentPlatformDefinition,
} from "@devtools/bindings";
import { AccountDiscoveryComponentLWD } from "./AccountDiscoveryComponentLWD";

export const accountDiscoveryIntentLWDDefinition: AccountDiscoveryIntentPlatformDefinition = {
  ...accountDiscoveryIntentDefinition,
  component: AccountDiscoveryComponentLWD,
};
