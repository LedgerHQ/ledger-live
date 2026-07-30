import { Challenge, crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import {
  WalletAuthInvalidChallengeError,
  WalletAuthNoCredentialsError,
  type IdentityProvider,
  type IdPAuthParams,
  type KeycloakToken,
} from "@ledgerhq/ledger-auth";
import type { TypedStartListening } from "@reduxjs/toolkit";
import getApi, {
  type Challenge as ChallengeJson,
  type LKRPChallenge,
  LKRPChallengeSchema,
  type WeakChallengeSignature,
} from "./api";
import type { MemberCredentials, Trustchain } from "./types";
import { convertLiveCredentialsToKeyPair, credentialForPubKey, liveAuthentication } from "./utils";
import { trustchainStoreActionTypePrefix, type TrustchainStore } from "./store";

interface PartialTrustchainStore {
  trustchain: Pick<Trustchain, "rootId"> | null;
  memberCredentials: MemberCredentials | null;
}

interface StateWithTrustchain {
  trustchain: TrustchainStore;
}

export interface LkrpIdentityProviderOptions<State extends StateWithTrustchain> {
  startListening?: TypedStartListening<State>;
}

export class LkrpIdentityProvider<
  State extends StateWithTrustchain = StateWithTrustchain,
> implements IdentityProvider {
  readonly brokerId = "lkrp";
  private trustchainStore: PartialTrustchainStore | undefined;

  constructor({ startListening }: LkrpIdentityProviderOptions<State> = {}) {
    startListening?.({
      predicate: action => action.type.startsWith(trustchainStoreActionTypePrefix),
      effect: (_action, listenerApi) => {
        this.setTrustchainStore(listenerApi.getState().trustchain);
      },
    });
  }

  async authenticate(request: IdPAuthParams): Promise<KeycloakToken> {
    const challenge = LkrpIdentityProvider.checkChallenge(request.challenge);
    const host = challenge.json.host;
    const api = getApi(`https://${host}`);

    const authorizationCode = await api.oidcPostChallengeResponse(
      await this.signChallenge(challenge),
    );

    const idPToken = await api.oidcExchangeAuthCode(
      authorizationCode,
      request.clientId,
      request.redirectUri,
      request.codeVerifier,
    );

    return api.oidcExchangeToken(idPToken, request.clientId);
  }

  setTrustchainStore(store: PartialTrustchainStore | undefined): void {
    this.trustchainStore = store;
  }

  private async signChallenge(challenge: LKRPChallenge): Promise<{
    challenge: ChallengeJson;
    signature: WeakChallengeSignature;
  }> {
    if (!this.trustchainStore?.memberCredentials) {
      throw new WalletAuthNoCredentialsError(this.brokerId);
    }

    const data = crypto.from_hex(challenge.tlv);
    const [parsed] = Challenge.fromBytes(data);
    const hash = crypto.hash(parsed.getUnsignedTLV());
    const keypair = convertLiveCredentialsToKeyPair(this.trustchainStore.memberCredentials);
    return {
      challenge: challenge.json,
      signature: {
        credential: credentialForPubKey(this.trustchainStore.memberCredentials.pubkey),
        signature: crypto.to_hex(crypto.sign(hash, keypair)),
        attestation: this.trustchainStore.trustchain?.rootId
          ? crypto.to_hex(liveAuthentication(this.trustchainStore.trustchain.rootId))
          : undefined,
      },
    };
  }

  private static checkChallenge(challenge: unknown): LKRPChallenge {
    try {
      return LKRPChallengeSchema.parse(challenge);
    } catch {
      throw new WalletAuthInvalidChallengeError();
    }
  }
}
