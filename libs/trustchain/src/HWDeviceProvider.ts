import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { ApduDevice } from "@ledgerhq/hw-trustchain/ApduDevice";
import Transport, { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { crypto, device } from "@ledgerhq/hw-trustchain";
import getApi from "./api";
import { genericWithJWT } from "./auth";
import { AuthCachePolicy, JWT, TrustchainDeviceCallbacks } from "./types";

export class HWDeviceProvider {
  private jwt?: JWT;
  private hw?: ApduDevice;
  private api: ReturnType<typeof getApi>;

  constructor(apiBaseURL: string) {
    this.api = getApi(apiBaseURL);
  }

  public withJwt<T>(
    transport: Transport,
    job: (jwt: JWT) => Promise<T>,
    policy?: AuthCachePolicy,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<T> {
    return genericWithJWT(
      jwt => {
        this.jwt = jwt;
        return job(jwt);
      },
      this.jwt,
      () => this._authWithDevice(transport, callbacks),
      (jwt: JWT) => this.api.refreshAuth(jwt),
      policy,
    );
  }

  public async withHw<T>(
    transport: Transport,
    job: (hw: ApduDevice) => Promise<T>,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<T> {
    callbacks?.onStartRequestUserInteraction();
    try {
      return await job(this.hw ?? this._refreshHwDevice(transport));
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

  public async refreshJwt(
    transport: Transport,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<void> {
    this.jwt = await this.withJwt(transport, this.api.refreshAuth, undefined, callbacks);
  }

  public clearJwt() {
    this.jwt = undefined;
  }

  private async _authWithDevice(
    transport: Transport,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<JWT> {
    const challenge = await this.api.getAuthenticationChallenge();
    const data = crypto.from_hex(challenge.tlv);
    const seedId = await this.withHw(transport, hw => hw.getSeedId(data), callbacks);
    const signature = crypto.to_hex(seedId.signature);
    return this.api.postChallengeResponse({
      challenge: challenge.json,
      signature: {
        credential: seedId.pubkeyCredential.toJSON(),
        signature,
        attestation: crypto.to_hex(seedId.attestationResult),
      },
    });
  }

  private _refreshHwDevice(transport: Transport): ApduDevice {
    this.hw = device.apdu(transport);
    return this.hw;
  }
}
