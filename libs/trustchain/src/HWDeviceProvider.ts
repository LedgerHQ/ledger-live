import { from, lastValueFrom } from "rxjs";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { ApduDevice } from "@ledgerhq/hw-trustchain/ApduDevice";
import { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { crypto, device } from "@ledgerhq/hw-trustchain";
import getApi from "./api";
import { genericWithJWT } from "./auth";
import { AuthCachePolicy, JWT, TrustchainDeviceCallbacks, WithDevice } from "./types";
import { TrustchainNotAllowed } from "./errors";

export class HWDeviceProvider {
  /**
   * TODO withDevice should be imported statically from @ledgerhq/live-common/hw/deviceAccess
   *
   * but ATM making @ledgerhq/live-common a dependency of @ledgerhq/trustchain causes:
   * > Turbo error: Invalid package dependency graph: cyclic dependency detected:
   * >   @ledgerhq/trustchain,@ledgerhq/live-wallet,@ledgerhq/live-common
   *
   * Maybe hw/deviceAccess.ts and hw/index.ts could be moved to @ledgerhq/devices
   * This would break the cyclic dependency as @ledgerhq/live-common would depend on @ledgerhq/devices
   * but not the other way around.
   */
  private withDevice: WithDevice;
  private jwt?: JWT;
  private api: ReturnType<typeof getApi>;

  constructor(apiBaseURL: string, withDevice: WithDevice) {
    this.api = getApi(apiBaseURL);
    this.withDevice = withDevice;
  }

  public withJwt<T>(
    deviceId: string,
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
      () => this._authWithDevice(deviceId, callbacks),
      (jwt: JWT) => this.api.refreshAuth(jwt),
      policy,
    );
  }

  public async withHw<T>(
    deviceId: string,
    job: (hw: ApduDevice) => Promise<T>,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<T> {
    callbacks?.onStartRequestUserInteraction?.();
    const runWithDevice = this.withDevice(deviceId);
    try {
      return await lastValueFrom(runWithDevice(transport => from(job(device.apdu(transport)))));
    } catch (error) {
      if (!(error instanceof TransportStatusError)) {
        throw error;
      }
      switch (error.statusCode) {
        case StatusCodes.USER_REFUSED_ON_DEVICE:
        case StatusCodes.CONDITIONS_OF_USE_NOT_SATISFIED:
          throw new UserRefusedOnDevice();

        case StatusCodes.TRUSTCHAIN_WRONG_SEED:
          this.clearJwt();
          throw new TrustchainNotAllowed();

        default:
          throw error;
      }
    } finally {
      callbacks?.onEndRequestUserInteraction?.();
    }
  }

  public async refreshJwt(deviceId: string, callbacks?: TrustchainDeviceCallbacks): Promise<void> {
    this.jwt = await this.withJwt(deviceId, this.api.refreshAuth, "cache", callbacks);
  }

  public clearJwt() {
    this.jwt = undefined;
  }

  private async _authWithDevice(
    deviceId: string,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<JWT> {
    const challenge = await this.api.getAuthenticationChallenge();
    const data = crypto.from_hex(challenge.tlv);
    const seedId = await this.withHw(deviceId, hw => hw.getSeedId(data), callbacks);
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
}
