import type { Operation } from "@ledgerhq/types-live";
import type { getURLWhatIsThisReturnType } from "./types";

import { urls } from "../../../../../config/urls";

/*
 * Handle the helper declaration.
 */

export const getURLWhatIsThis = (operation: Operation): getURLWhatIsThisReturnType =>
  !["IN", "OUT"].includes(operation.type) ? urls.elrondStaking : undefined;
