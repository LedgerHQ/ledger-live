import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { crypto } from "@ledgerhq/hw-trustchain";
import { ApduDevice } from "@ledgerhq/hw-trustchain/ApduDevice";

import api from "./api";
import { AuthCachePolicy, JWT, TrustchainDeviceCallbacks } from "./types";
import { genericWithJWT } from "./auth";
import { UserRefusedOnDevice } from "@ledgerhq/errors";

export class HWDeviceProvider {
  private policy?: AuthCachePolicy;
  private jwt?: JWT;

  constructor(policy?: AuthCachePolicy) {
    this.policy = policy;
  }

  public withJwt<T>(transport: Transport, job: (jwt: JWT) => Promise<T>): Promise<T> {
    return genericWithJWT(
      jwt => {
        this.jwt = jwt;
        return job(jwt);
      },
      this.jwt,
      () => this._authWithDevice(transport),
      this.policy,
    );
  }

  public async withHw<T>(
    transport: Transport,
    job: (hw: ApduDevice) => Promise<T>,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<T> {
    callbacks?.onStartRequestUserInteraction();
    const hw = new ApduDevice(transport);
    try {
      return await job(hw);
    } catch (error) {
      if (
        error instanceof TransportStatusError &&
        [StatusCodes.USER_REFUSED_ON_DEVICE, StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED].includes(
          error.statusCode,
        )
      ) {
        throw new UserRefusedOnDevice();
      }
      throw error;
    } finally {
      callbacks?.onEndRequestUserInteraction();
    }
  }

  private async _authWithDevice(transport: Transport): Promise<JWT> {
    const challenge = await api.getAuthenticationChallenge();
    const data = crypto.from_hex(challenge.tlv);
    const seedId = await this.withHw(transport, hw => hw.getSeedId(data));
    const signature = crypto.to_hex(seedId.signature);
    return api.postChallengeResponse({
      challenge: challenge.json,
      signature: {
        credential: seedId.pubkeyCredential.toJSON(),
        signature,
        attestation: crypto.to_hex(seedId.attestationResult),
      },
    });
  }
}
