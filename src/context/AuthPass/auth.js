// @flow
import biometry from "./methods/biometry";

export default async (reason: string) => {
  let success = false;
  if (await biometry.isSensorAvailable()) {
    success = await biometry.authenticate({description:reason});
    biometry.release();
  }
  return success;
};
