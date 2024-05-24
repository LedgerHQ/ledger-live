import { JWT, LiveCredentials, Trustchain, TrustchainMember, TrustchainSDK } from "./types";
import * as HwTrustchain from "@ledgerhq/hw-trustchain";
import Transport from "@ledgerhq/hw-transport";

// FIXME (temporary) remove these lines after we uses them
import "./api";
void HwTrustchain;

export class SDK implements TrustchainSDK {
  initLiveCredentials(): LiveCredentials {
    throw new Error("initLiveCredentials not implemented.");
  }

  /*
   * - get challenge
   * - send to the device to sign it
   * - post challenge, and get an JWT
   */
  async seedIdAuthenticate(transport: Transport): Promise<string> {
    void transport;
    throw new Error("seedIdAuthenticate not implemented.");
  }

  async liveAuthenticate(
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<JWT> {
    void trustchain;
    void liveInstanceCredentials;
    throw new Error("liveAuthenticate not implemented.");
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
