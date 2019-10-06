// @flow
import shajs from "sha.js";

export const sha256 = (str: string): string =>
  shajs("sha256")
    .update(str)
    .digest("hex");