import { firstValueFrom, Observable } from "rxjs";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { ApduDevice } from "@ledgerhq/hw-trustchain/ApduDevice";
import { StatusCodes, TransportStatusError } from "@ledgerhq/hw-transport";
import { crypto, device } from "@ledgerhq/hw-trustchain";
import getApi from "./api";
import { genericWithJWT } from "./auth";
import { AuthCachePolicy, JWT, TrustchainDeviceCallbacks, WithDevice } from "./types";

export class HWDeviceProvider {
  private withDevice$: Observable<WithDevice>;
  private jwt?: JWT;
  private api: ReturnType<typeof getApi>;

  constructor(apiBaseURL: string, withDevice$: Observable<WithDevice>) {
    this.api = getApi(apiBaseURL);
    this.withDevice$ = withDevice$;
  }

  public withJwt<T>(
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
      () => this._authWithDevice(callbacks),
      (jwt: JWT) => this.api.refreshAuth(jwt),
      policy,
    );
  }

  public async withHw<T>(
    job: (hw: ApduDevice) => Promise<T>,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<T> {
    callbacks?.onStartRequestUserInteraction();
    const withDevice = await firstValueFrom(this.withDevice$);
    try {
      return await withDevice(transport => job(device.apdu(transport)));
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

  public async refreshJwt(callbacks?: TrustchainDeviceCallbacks): Promise<void> {
    this.jwt = await this.withJwt(this.api.refreshAuth, undefined, callbacks);
  }

  public clearJwt() {
    this.jwt = undefined;
  }

  private async _authWithDevice(callbacks?: TrustchainDeviceCallbacks): Promise<JWT> {
    const challenge = await this.api.getAuthenticationChallenge();
    const data = crypto.from_hex(challenge.tlv);
    const seedId = await this.withHw(hw => hw.getSeedId(data), callbacks);
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
