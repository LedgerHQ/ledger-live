import resolver from "../../../families/xrp/getAddress";
import { CreateSigner, executeWithSigner } from "../../setup";
import Xrp from "@ledgerhq/hw-app-xrp";
import Transport from "@ledgerhq/hw-transport";

export const createSigner: CreateSigner<Xrp> = (transport: Transport) => {
  return new Xrp(transport);
};

export const context = executeWithSigner(createSigner);
export const getAddress = resolver(context);
