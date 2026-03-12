import { log } from "@ledgerhq/logs";
import type { NamedSchemaError } from "@reduxjs/toolkit/query";

type SchemaFailureHandler = {
  apiName: string;
  endpoint: string;
  error: NamedSchemaError;
};

export const onSchemaFailure = ({ apiName, endpoint, error }: SchemaFailureHandler) => {
  log(apiName, `Invalid ${endpoint} response schema:`, {
    issues: error.issues,
  });
};
