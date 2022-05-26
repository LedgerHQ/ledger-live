import { makeSync, makeScanAccounts } from "../../bridge/jsHelpers";
import { CosmosAccount } from "../cosmos/js-synchronisation";
import { osmosisAPI } from "./api/sdk";

const account = new CosmosAccount({
  api: osmosisAPI,
  accountPubPrefix: "osmospub", // TODO - verify this is the correct account public key prefix.
  accountAddressPrefix: "osmos",
});

export const scanAccounts = makeScanAccounts({
  getAccountShape: account.getAccountShape,
});

export const sync = makeSync({ getAccountShape: account.getAccountShape });
