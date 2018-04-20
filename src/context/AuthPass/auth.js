// @flow
import biometry from "./methods/biometry";
import passCode from "./methods/passCode"; // eslint-disable-line

export default async (reason: string) => {
  let success = false;
  if (await passCode.isSupported()) {
    success = await passCode.authenticate(reason);
  } else if (await biometry.isSupported()) {
    success = await biometry.authenticate(reason);
  }
  return success;
};
