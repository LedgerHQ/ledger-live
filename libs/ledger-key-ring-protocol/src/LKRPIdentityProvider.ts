import { Challenge, crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import {
  WalletAuthInvalidChallengeError,
  WalletAuthNoCredentialsError,
  type IdentityProvider,
  type IdPAuthParams,
  type KeycloakToken,
} from "@ledgerhq/ledger-auth";
import getApi, { type ChallengeSignature, type Challenge as ChallengeJson } from "./api";
import type { MemberCredentials } from "./types";
import { convertLiveCredentialsToKeyPair, credentialForPubKey, liveAuthentication } from "./utils";

type LKRPChallenge = { json: ChallengeJson; tlv: string };

export class LkrpIdentityProvider implements IdentityProvider {
  readonly brokerId = "lkrp";
  private keypair?: MemberCredentials;
  private trustchainId?: string;

  async authenticate(request: IdPAuthParams): Promise<KeycloakToken> {
    LkrpIdentityProvider.checkChallenge(request.challenge);

    const host = request.challenge.json.host;
    const api = getApi(`https://${host}`);

    const authorizationCode = await api.oidcPostChallengeResponse(
      this.signChallenge(request.challenge),
    );

    const idPToken = await api.oidcExchangeAuthCode(
      authorizationCode,
      request.clientId,
      request.redirectUri,
      request.codeVerifier,
    );

    return api.oidcExchangeToken(idPToken, request.clientId);
  }

  setKeypair(keypair?: MemberCredentials | undefined): void {
    this.keypair = keypair ?? undefined;
  }

  setTrustchainId(trustchainId: string | undefined): void {
    this.trustchainId = trustchainId ?? undefined;
  }

  private signChallenge(challenge: LKRPChallenge): {
    challenge: ChallengeJson;
    signature: ChallengeSignature;
  } {
    if (!this.keypair || !this.trustchainId) {
      throw new WalletAuthNoCredentialsError(this.brokerId);
    }

    const data = crypto.from_hex(challenge.tlv);
    const [parsed] = Challenge.fromBytes(data);
    const hash = crypto.hash(parsed.getUnsignedTLV());
    const keypair = convertLiveCredentialsToKeyPair(this.keypair);
    return {
      challenge: challenge.json,
      signature: {
        credential: credentialForPubKey(this.keypair.pubkey),
        signature: crypto.to_hex(crypto.sign(hash, keypair)),
        attestation: crypto.to_hex(liveAuthentication(this.trustchainId)),
      },
    };
  }

  private static checkChallenge(challenge: unknown): asserts challenge is LKRPChallenge {
    // TODO: use zod for proper validation
    if (typeof challenge !== "object" || challenge === null) {
      throw new WalletAuthInvalidChallengeError();
    }
  }
}
