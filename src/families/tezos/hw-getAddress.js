// @flow

import Xtz from "./hw-app-xtz";
import type { Resolver } from "../../hw/getAddress/types";

const resolver: Resolver = async (
  transport,
  { path, verify, askChainCode }
) => {
  const xtz = new Xtz(transport);
  const r = await xtz.getAddress(path, {
    askChainCode,
    verify
  });
  return { ...r, path };
};

export default resolver;
