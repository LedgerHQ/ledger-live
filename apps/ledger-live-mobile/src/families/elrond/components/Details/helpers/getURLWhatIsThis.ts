import type { Operation } from "@ledgerhq/types-live";
import type { getURLWhatIsThisReturnType } from "./types";

import { urls } from "~/utils/urls";

/*
 * Handle the helper declaration.
 */

export const getURLWhatIsThis = (operation: Operation): getURLWhatIsThisReturnType =>
  !["IN", "OUT"].includes(operation.type) ? urls.elrondStaking : undefined;
