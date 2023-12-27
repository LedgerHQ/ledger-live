import type { Operation } from "@ledgerhq/types-live";
import type { getURLFeesInfoReturnType } from "./types";

import { urls } from "~/utils/urls";

/*
 * Handle the helper declaration.
 */

export const getURLFeesInfo = (operation: Operation): getURLFeesInfoReturnType =>
  operation.fee.isGreaterThan(200000) ? urls.elrondStaking : undefined;
