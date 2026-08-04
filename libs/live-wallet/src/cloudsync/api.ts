// Deprecated: compatibility shim, import @shared/cloud-sync directly.
export type {
  JWT,
  APISyncResponse,
  APISyncUpdateResponse,
  StatusAPIResponse,
} from "@shared/cloud-sync";
export { getCloudSyncApi as default } from "@shared/cloud-sync";
