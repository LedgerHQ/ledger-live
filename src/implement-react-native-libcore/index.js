// @flow
import { setLoadCoreImplementation } from "@ledgerhq/live-common/lib/libcore/access";
import { setRemapLibcoreErrorsImplementation } from "@ledgerhq/live-common/lib/libcore/errors";
import { loadCore } from "./loadCoreImpl";
import { remapLibcoreErrors } from "./errorsImpl";

setLoadCoreImplementation(loadCore);
setRemapLibcoreErrorsImplementation(remapLibcoreErrors);
