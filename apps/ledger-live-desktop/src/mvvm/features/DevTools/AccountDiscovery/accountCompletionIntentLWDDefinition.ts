import {
  accountCompletionIntentDefinition,
  type AccountCompletionIntentPlatformDefinition,
} from "@devtools/bindings";
import { AccountCompletionComponentLWD } from "./AccountCompletionComponentLWD";

export const accountCompletionIntentLWDDefinition: AccountCompletionIntentPlatformDefinition = {
  ...accountCompletionIntentDefinition,
  component: AccountCompletionComponentLWD,
};
