import { flagWith } from "../../define";
import { z } from "zod";

const DEFAULT_LOGIN_MANIFEST_ID = "baanx-login-url-stg";
const DEFAULT_HOSTED_MANIFEST_ID = "baanx-hosted-url-stg";

export const lwdPayTab = flagWith(
  {
    card: z.boolean(),
    baanx_login_manifest_id: z.string().default(DEFAULT_LOGIN_MANIFEST_ID),
    baanx_hosted_manifest_id: z.string().default(DEFAULT_HOSTED_MANIFEST_ID),
  },
  {
    enabled: false,
    params: {
      card: true,
      baanx_login_manifest_id: DEFAULT_LOGIN_MANIFEST_ID,
      baanx_hosted_manifest_id: DEFAULT_HOSTED_MANIFEST_ID,
    },
  },
);
