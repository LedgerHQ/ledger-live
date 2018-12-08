// @flow
import biometry from "./methods/biometry";

export default async (reason: string) => {
  let success = false;
  if (await biometry.isSupported()) {
    success = await biometry.authenticate(reason);
  }
  return success;
};
