// @flow
import { setLoadCoreImplementation } from "../access";
import { setRemapLibcoreErrorsImplementation } from "../errors";
import { loadCore } from "./loadCoreImpl";
import { remapLibcoreErrors } from "./errorsImpl";

setLoadCoreImplementation(loadCore);
setRemapLibcoreErrorsImplementation(remapLibcoreErrors);
