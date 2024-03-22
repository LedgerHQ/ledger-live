/* eslint-disable @typescript-eslint/ban-ts-comment */
import { User } from "@alchemy/aa-alchemy";
import { AlchemySigner } from "@alchemy/aa-alchemy";
import { getEnv } from "@ledgerhq/live-env";
import * as zerodev from "./zerodev";
import { chains } from "./chains";

const AA_ALCHEMY_APIKEY = getEnv("AA_ALCHEMY_APIKEY");

export const signer = new AlchemySigner({
  client: {
    // This is created in your dashboard under `https://dashboard.alchemy.com/settings/access-keys`
    // NOTE: it is not recommended to expose your API key on the client, instead proxy requests to your backend and set the `rpcUrl`
    // here to point to your backend.
    connection: { apiKey: AA_ALCHEMY_APIKEY },
    iframeConfig: {
      // you will need to render a container with this id in your DOM
      iframeContainerId: "turnkey-iframe-container",
    },
  },
});

function authenticate(email: string) {
  console.log(`alchemy signer.authenticate ${email}`);
  signer.authenticate({ type: "email", email });
}

// second step when user clicked on mail and was redirected through deep link
async function completeAuthenticate(
  orgId: string,
  bundle: string,
): Promise<{ email: string | undefined; address: string }> {
  console.log(`[completeAuthenticate] completing for bundle = ${bundle} orgId = ${orgId}`);
  const res: User = await signer.authenticate({ type: "email", bundle, orgId });
  console.log({ completeAuthenticateRes: res });
  return { email: res.email, address: res.address };
}

export { authenticate, completeAuthenticate, zerodev, chains };
