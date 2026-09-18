import type { MemberCredentials, Trustchain, TrustchainMember } from "@shared/lkrp";
import { LkrpQrNotImplementedError } from "./errors";

export type AddMember = (member: TrustchainMember) => Promise<Trustchain>;

export interface LkrpQrChannel {
  send(message: unknown): Promise<void>;
  receive(): AsyncIterable<unknown>;
  close(): Promise<void>;
}

export interface LkrpQrTransport {
  createHost(): Promise<{
    readonly url: string;
    readonly channel: LkrpQrChannel;
  }>;
  connect(scannedUrl: string): Promise<LkrpQrChannel>;
}

export type CreateQRCodeHostOptions = {
  readonly transport: LkrpQrTransport;
  readonly onDisplayQRCode: (url: string) => void;
  readonly onDisplayDigits: (digits: string) => void;
  readonly addMember: AddMember;
  readonly memberCredentials: MemberCredentials;
  readonly memberName: string;
  readonly initialTrustchainId?: string;
};

export type CreateQRCodeCandidateOptions = {
  readonly transport: LkrpQrTransport;
  readonly memberCredentials: MemberCredentials;
  readonly memberName: string;
  readonly addMember: AddMember;
  readonly initialTrustchainId?: string;
  readonly scannedUrl: string;
  readonly onRequestQRCodeInput: (
    config: { readonly digits: number; readonly connected: boolean },
    submit: (digits: string) => void,
  ) => void;
};

export function createQRCodeHostInstance(
  _options: CreateQRCodeHostOptions,
): Promise<Trustchain | void> {
  return Promise.reject(new LkrpQrNotImplementedError("host"));
}

export function createQRCodeCandidateInstance(
  _options: CreateQRCodeCandidateOptions,
): Promise<Trustchain | void> {
  return Promise.reject(new LkrpQrNotImplementedError("candidate"));
}
