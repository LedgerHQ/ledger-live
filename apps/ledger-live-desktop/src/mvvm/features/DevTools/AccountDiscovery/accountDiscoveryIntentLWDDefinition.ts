import {
  accountDiscoveryIntentDefinition,
  type AccountDiscoveryIntentPlatformDefinition,
} from "@features/platform-account-discovery-intent";
import { AccountDiscoveryComponentLWD } from "./AccountDiscoveryComponentLWD";

export const accountDiscoveryIntentLWDDefinition: AccountDiscoveryIntentPlatformDefinition = {
  ...accountDiscoveryIntentDefinition,
  component: AccountDiscoveryComponentLWD,
};
