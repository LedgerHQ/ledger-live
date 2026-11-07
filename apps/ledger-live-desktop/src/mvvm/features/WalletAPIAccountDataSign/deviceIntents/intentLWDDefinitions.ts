import {
  signAccountMessageIntentDefinition,
  type SignAccountMessageIntentPlatformDefinition,
} from "@features/platform-sign-account-message-intent";
import {
  signAccountTransactionIntentDefinition,
  type SignAccountTransactionIntentPlatformDefinition,
} from "@features/platform-sign-account-transaction-intent";
import {
  verifyAddressIntentDefinition,
  type VerifyAddressIntentPlatformDefinition,
} from "@features/platform-verify-address-intent";
import { SignOnDeviceComponentLWD } from "./SignOnDeviceComponentLWD";
import { VerifyReceiveAddressComponentLWD } from "./VerifyReceiveAddressComponentLWD";

export const signAccountTransactionIntentLWDDefinition: SignAccountTransactionIntentPlatformDefinition =
  { ...signAccountTransactionIntentDefinition, component: SignOnDeviceComponentLWD };

export const signAccountMessageIntentLWDDefinition: SignAccountMessageIntentPlatformDefinition = {
  ...signAccountMessageIntentDefinition,
  component: SignOnDeviceComponentLWD,
};

export const verifyReceiveAddressIntentLWDDefinition: VerifyAddressIntentPlatformDefinition = {
  ...verifyAddressIntentDefinition,
  component: VerifyReceiveAddressComponentLWD,
};
