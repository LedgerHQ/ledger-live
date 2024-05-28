import { JWT, LiveCredentials, Trustchain, TrustchainMember, TrustchainSDK } from "./types";
import { crypto, device, Challenge } from "@ledgerhq/hw-trustchain";
import Transport from "@ledgerhq/hw-transport";
import api from "./api";

class SDK implements TrustchainSDK {
  initLiveCredentials(): LiveCredentials {
    throw new Error("initLiveCredentials not implemented.");
  }

  /*
   * - get challenge
   * - send to the device to sign it
   * - post challenge, and get an JWT
   */
  async seedIdAuthenticate(transport: Transport): Promise<JWT> {
    const hw = device.apdu(transport);
    const challenge = await api.getAuthenticationChallenge();
    const data = crypto.from_hex(challenge.tlv);
    const seedId = await hw.getSeedId(data);
    const signature = crypto.to_hex(seedId.signature);
    const response = await api.postChallengeResponse({
      challenge: challenge.json,
      signature: {
        credential: seedId.pubkeyCredential.toJSON(),
        signature,
        attestation: crypto.to_hex(seedId.attestationResult),
      },
    });
    return { accessToken: response.access_token };
  }

  async liveAuthenticate(
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<JWT> {
    const challenge = await api.getAuthenticationChallenge();
    const data = crypto.from_hex(challenge.tlv);
    const [parsed, _] = Challenge.fromBytes(data);
    const hash = await crypto.hash(parsed.getUnsignedTLV());
    const sig = await crypto.sign(hash, liveInstanceCredentials.keypair);
    const signature = crypto.to_hex(sig);
    const credential = {
      version: 0,
      curveId: 33,
      signAlgorithm: 1,
      publicKey: crypto.to_hex(liveInstanceCredentials.keypair.publicKey),
    };
    const trustchainId = crypto.from_hex(trustchain.rootId);
    const att = new Uint8Array(2 + trustchainId.length);
    att[0] = 0x01;
    att[1] = trustchainId.length;
    att.set(trustchainId, 2);
    const attestation = crypto.to_hex(data);
    const response = await api.postChallengeResponse({
      challenge: challenge.json,
      signature: {
        credential,
        signature,
        attestation,
      },
    });
    return { accessToken: response.access_token };
  }

  async getOrCreateTrustchain(
    transport: Transport,
    seedIdToken: JWT,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<Trustchain> {
    void transport;
    void seedIdToken;
    void liveInstanceCredentials;
    throw new Error("getOrCreateTrustchain not implemented.");
  }

  async restoreTrustchain(
    liveJWT: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<Trustchain> {
    void liveJWT;
    void trustchain;
    void liveInstanceCredentials;
    throw new Error("restoreTrustchain not implemented.");
  }

  async getMembers(
    liveJWT: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<TrustchainMember[]> {
    void liveJWT;
    void trustchain;
    void liveInstanceCredentials;
    throw new Error("getMembers not implemented.");
  }

  async removeMember(
    transport: Transport,
    seedIdToken: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
    member: TrustchainMember,
  ): Promise<Trustchain> {
    void transport;
    void seedIdToken;
    void trustchain;
    void liveInstanceCredentials;
    void member;
    throw new Error("removeMember not implemented.");
  }

  async destroyTrustchain(trustchain: Trustchain, liveJWT: JWT): Promise<void> {
    void trustchain;
    void liveJWT;
    throw new Error("destroyTrustchain not implemented.");
  }
}

export const sdk = new SDK();
