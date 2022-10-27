import { TransactionCommon } from "@ledgerhq/types-live";
import { DeployUtil } from "casper-js-sdk";

export interface Transaction extends TransactionCommon {
  deploy: DeployUtil.Deploy;
}
