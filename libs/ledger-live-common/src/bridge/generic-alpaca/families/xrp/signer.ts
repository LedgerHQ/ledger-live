import resolver from "../../../../families/xrp/getAddress";
import { CreateSigner, executeWithSigner } from "../../../setup";
import type { AlpacaSigner } from "../../types";
import Xrp from "@ledgerhq/hw-app-xrp";
import Transport from "@ledgerhq/hw-transport";

export const createSigner: CreateSigner<Xrp> = (transport: Transport) => {
  return new Xrp(transport);
};

const context = executeWithSigner(createSigner);

export default {
  context,
  getAddress: resolver(context),
} satisfies AlpacaSigner;
