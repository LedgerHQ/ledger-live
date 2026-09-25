export type LkrpKey = {
  readonly id: string;
  readonly publicKey: Uint8Array;
};

export type MemberCredentials = {
  readonly key: LkrpKey;
};

export type TrustchainMember = {
  readonly id: string;
  readonly name: string;
  readonly publicKey: Uint8Array;
};

export type Trustchain = {
  readonly rootId: string;
  readonly applicationPath: string;
};

export enum TrustchainResultType {
  created = "created",
  updated = "updated",
  restored = "restored",
}

export type TrustchainResult = {
  readonly type: TrustchainResultType;
  readonly trustchain: Trustchain;
};

export type DestroyApplicationResult = {
  readonly trustchainDestroyed: boolean;
};

export type LkrpNode = {
  readonly id: string;
  readonly parentId?: string;
  readonly payload: Uint8Array;
};

export type LkrpBlock = {
  readonly id: string;
  readonly issuer: Uint8Array;
  readonly payload: Uint8Array;
};

export type LkrpStream = {
  readonly path: string;
  readonly blocks: readonly LkrpBlock[];
};

export type TrustchainSnapshot = {
  readonly rootId: string;
  readonly nodes: readonly LkrpNode[];
  readonly streams: readonly LkrpStream[];
};

export type CreateTrustchainInput = {
  readonly applicationId: number;
  readonly member: TrustchainMember;
  readonly localCredentials: MemberCredentials;
};

export type AddMemberInput = {
  readonly trustchain: Trustchain;
  readonly member: TrustchainMember;
  readonly localCredentials: MemberCredentials;
};

export type RemoveMemberInput = AddMemberInput;
