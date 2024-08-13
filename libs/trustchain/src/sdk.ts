import {
  JWT,
  MemberCredentials,
  TrustchainSDKContext,
  Trustchain,
  TrustchainMember,
  TrustchainSDK,
  TrustchainDeviceCallbacks,
  AuthCachePolicy,
  TrustchainResult,
  TrustchainResultType,
  TrustchainLifecycle,
} from "./types";
import {
  crypto,
  Challenge,
  CommandStreamEncoder,
  StreamTree,
  Permissions,
  DerivationPath,
  SoftwareDevice,
  Device,
} from "@ledgerhq/hw-trustchain";
import getApi from "./api";
import { KeyPair as CryptoKeyPair } from "@ledgerhq/hw-trustchain/Crypto";
import { log } from "@ledgerhq/logs";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { TrustchainEjected, TrustchainNotAllowed, TrustchainOutdated } from "./errors";
import { HWDeviceProvider } from "./HWDeviceProvider";
import { genericWithJWT } from "./auth";

type WithJwt = <T>(job: (jwt: JWT) => Promise<T>) => Promise<T>;
type WithDevice = <T>(job: (device: Device) => Promise<T>) => Promise<T>;

export class SDK implements TrustchainSDK {
  private context: TrustchainSDKContext;
  private hwDeviceProvider: HWDeviceProvider;
  private lifecycle?: TrustchainLifecycle;
  private api: ReturnType<typeof getApi>;

  constructor(
    context: TrustchainSDKContext,
    hwDeviceProvider: HWDeviceProvider,
    lifecyle?: TrustchainLifecycle,
  ) {
    this.context = context;
    this.hwDeviceProvider = hwDeviceProvider;
    this.lifecycle = lifecyle;
    this.api = getApi(context.apiBaseUrl);
  }

  private jwt: JWT | undefined = undefined;
  private jwtHash = "";
  withAuth<T>(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    job: (jwt: JWT) => Promise<T>,
    policy?: AuthCachePolicy,
    ignorePermissionsChecks?: boolean,
  ): Promise<T> {
    const hash = trustchain.rootId + " " + memberCredentials.pubkey;
    if (this.jwtHash !== hash) {
      this.jwt = undefined;
      this.jwtHash = hash;
    }
    return genericWithJWT(
      jwt => {
        this.jwt = jwt;
        if (!ignorePermissionsChecks) {
          const permissions = jwt.permissions[trustchain.rootId];
          if (!permissions) {
            throw new TrustchainNotAllowed("permissions not available for current trustchain");
          }
          // check if the application path is allowed
          if (!permissions[trustchain.applicationPath]) {
            throw new TrustchainOutdated(
              `expected ${trustchain.applicationPath}, got: ${Object.keys(permissions)[0]}`,
            );
          }
        }
        return job(jwt);
      },
      this.jwt,
      () => this.auth(trustchain, memberCredentials),
      jwt => this.api.refreshAuth(jwt),
      policy,
    );
  }

  async initMemberCredentials(): Promise<MemberCredentials> {
    const kp = await crypto.randomKeypair();
    return convertKeyPairToLiveCredentials(kp);
  }

  async getOrCreateTrustchain(
    deviceId: string,
    memberCredentials: MemberCredentials,
    callbacks?: TrustchainDeviceCallbacks,
    topic?: Uint8Array,
  ): Promise<TrustchainResult> {
    let type = TrustchainResultType.restored;

    const withJwt: WithJwt = job =>
      this.hwDeviceProvider.withJwt(deviceId, job, undefined, callbacks);
    const withHw: WithDevice = job => this.hwDeviceProvider.withHw(deviceId, job, callbacks);

    let trustchains = await withJwt(this.api.getTrustchains);

    if (Object.keys(trustchains).length === 0) {
      log("trustchain", "getOrCreateTrustchain: no trustchain yet, let's create one");
      type = TrustchainResultType.created;
      const streamTree = await this.hwDeviceProvider.withHw(deviceId, hw =>
        StreamTree.createNewTree(hw, { topic }),
      );
      await streamTree.getRoot().resolve(); // double checks the signatures are correct before sending to the backend
      const commandStream = CommandStreamEncoder.encode(streamTree.getRoot().blocks);
      await withJwt(jwt => this.api.postSeed(jwt, crypto.to_hex(commandStream)));
      // deviceJwt have changed, proactively refresh it
      await this.hwDeviceProvider.refreshJwt(deviceId, callbacks);
      trustchains = await withJwt(this.api.getTrustchains);
    }

    // we find our trustchain root id
    let trustchainRootId: string | undefined;
    const trustchainRootPath = "m/";
    for (const [trustchainId, info] of Object.entries(trustchains)) {
      for (const path in info) {
        if (path === trustchainRootPath) {
          trustchainRootId = trustchainId;
        }
      }
    }

    invariant(trustchainRootId, "trustchainRootId should be defined");
    log("trustchain", "getOrCreateTrustchain rootId=" + trustchainRootId);

    // make a stream tree from all the trustchains associated to this root id
    let { streamTree } = await withJwt(jwt => this.fetchTrustchain(jwt, trustchainRootId));
    const path = streamTree.getApplicationRootPath(this.context.applicationId);
    const child = streamTree.getChild(path);
    let shouldShare = true;

    if (child) {
      const resolved = await child.resolve();
      const members = resolved.getMembers();

      shouldShare = !members.some(m => crypto.to_hex(m) === memberCredentials.pubkey); // not already a member
    }
    if (shouldShare) {
      if (type === TrustchainResultType.restored) type = TrustchainResultType.updated;
      streamTree = await this.pushMember(streamTree, path, trustchainRootId, withJwt, withHw, {
        id: memberCredentials.pubkey,
        name: this.context.name,
        permissions: Permissions.OWNER,
      });
    }

    const walletSyncEncryptionKey = await extractEncryptionKey(streamTree, path, memberCredentials);

    const trustchain = {
      rootId: trustchainRootId,
      walletSyncEncryptionKey,
      applicationPath: path,
    };

    return { type, trustchain };
  }

  async restoreTrustchain(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Promise<Trustchain> {
    const { streamTree, applicationRootPath } = await this.withAuth(
      trustchain,
      memberCredentials,
      jwt => this.fetchTrustchainAndResolve(jwt, trustchain.rootId, this.context.applicationId),
      "refresh",
      true,
    );
    const walletSyncEncryptionKey = await extractEncryptionKey(
      streamTree,
      applicationRootPath,
      memberCredentials,
    );

    return {
      rootId: trustchain.rootId,
      walletSyncEncryptionKey,
      applicationPath: applicationRootPath,
    };
  }

  async getMembers(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Promise<TrustchainMember[]> {
    const { resolved } = await this.withAuth(trustchain, memberCredentials, jwt =>
      this.fetchTrustchainAndResolve(jwt, trustchain.rootId, this.context.applicationId),
    );
    const members = resolved.getMembersData();
    if (!members.some(m => m.id === memberCredentials.pubkey)) {
      throw new TrustchainEjected("Not a member of trustchain");
    }
    return members;
  }

  async removeMember(
    deviceId: string,
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    member: TrustchainMember,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<Trustchain> {
    const withJwt: WithJwt = job =>
      this.hwDeviceProvider.withJwt(deviceId, job, undefined, callbacks);
    const withHw: WithDevice = job => this.hwDeviceProvider.withHw(deviceId, job, callbacks);

    // invariant because the sdk does not support this case, and the UI should not allows it.
    invariant(
      memberCredentials.pubkey !== member.id,
      "removeMember must not be used to remove the current member.",
    );

    const afterRotation = await this.lifecycle?.onTrustchainRotation(
      this,
      trustchain,
      memberCredentials,
    );

    const applicationId = this.context.applicationId;
    const trustchainId = trustchain.rootId;
    // eslint-disable-next-line prefer-const
    let { resolved, streamTree, applicationRootPath } = await withJwt(jwt =>
      this.fetchTrustchainAndResolve(jwt, trustchainId, applicationId),
    );
    const members = resolved.getMembersData();
    const withoutMember = members.filter(m => m.id !== member.id);
    invariant(withoutMember.length < members.length, "member not found"); // invariant because the UI should not allow this case.
    const withoutMemberOrMe = withoutMember.filter(m => m.id !== memberCredentials.pubkey);
    const softwareDevice = getSoftwareDevice(memberCredentials);

    const newPath = streamTree.getApplicationRootPath(applicationId, 1);

    // We close the current trustchain with the hardware wallet in order to get a user confirmation of the action
    const sendCloseStreamToAPI = await this.closeStream(
      streamTree,
      applicationRootPath,
      trustchainId,
      withJwt,
      withHw,
    );

    // derive a new branch of the tree on the new path
    streamTree = await this.pushMember(streamTree, newPath, trustchainId, withJwt, withHw, {
      id: memberCredentials.pubkey,
      name: this.context.name,
      permissions: Permissions.OWNER,
    });

    // add the remaining members
    const withSw = (job: (device: Device) => Promise<StreamTree>) => job(softwareDevice);
    for (const m of withoutMemberOrMe) {
      streamTree = await this.pushMember(streamTree, newPath, trustchainId, withJwt, withSw, m);
    }
    const walletSyncEncryptionKey = await extractEncryptionKey(
      streamTree,
      newPath,
      memberCredentials,
    );

    // we send the close stream to the API only after the new stream is created in case user cancelled the process in the middle.
    await sendCloseStreamToAPI();

    // deviceJwt have changed, proactively refresh it
    await this.hwDeviceProvider.refreshJwt(deviceId, callbacks);

    const newTrustchain: Trustchain = {
      rootId: trustchainId,
      walletSyncEncryptionKey,
      applicationPath: newPath,
    };

    if (afterRotation) await afterRotation(newTrustchain);

    // refresh the jwt with the new trustchain
    this.jwt = await this.withAuth(
      newTrustchain,
      memberCredentials,
      jwt => Promise.resolve(jwt),
      "refresh",
    );

    return newTrustchain;
  }

  async addMember(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    member: TrustchainMember,
  ): Promise<void> {
    const withJwt: WithJwt = f => this.withAuth(trustchain, memberCredentials, f);
    const { streamTree, applicationRootPath } = await withJwt(jwt =>
      this.fetchTrustchainAndResolve(jwt, trustchain.rootId, this.context.applicationId),
    );
    const softwareDevice = getSoftwareDevice(memberCredentials);
    const withSw = (job: (device: Device) => Promise<StreamTree>) => job(softwareDevice);
    await this.pushMember(
      streamTree,
      applicationRootPath,
      trustchain.rootId,
      withJwt,
      withSw,
      member,
    );
  }

  async destroyTrustchain(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Promise<void> {
    await this.withAuth(trustchain, memberCredentials, jwt =>
      this.api.deleteTrustchain(jwt, trustchain.rootId),
    );
    this.jwt = undefined;
    this.hwDeviceProvider.clearJwt();
  }

  async encryptUserData(trustchain: Trustchain, input: Uint8Array): Promise<Uint8Array> {
    const key = crypto.from_hex(trustchain.walletSyncEncryptionKey);
    const encrypted = await crypto.encryptUserData(key, input);
    return encrypted;
  }

  async decryptUserData(trustchain: Trustchain, data: Uint8Array): Promise<Uint8Array> {
    const key = crypto.from_hex(trustchain.walletSyncEncryptionKey);
    const decrypted = await crypto.decryptUserData(key, data);
    return decrypted;
  }

  private async fetchTrustchain(jwt: JWT, trustchainId: string) {
    const trustchainData = await this.api.getTrustchain(jwt, trustchainId);
    const streamTree = StreamTree.deserialize(trustchainData);
    return { streamTree };
  }

  private async fetchTrustchainAndResolve(jwt: JWT, trustchainId: string, applicationId: number) {
    const { streamTree } = await this.fetchTrustchain(jwt, trustchainId);
    const applicationRootPath = streamTree.getApplicationRootPath(applicationId);
    const applicationNode = streamTree.getChild(applicationRootPath);
    invariant(applicationNode, "could not find the application stream.");
    const resolved = await applicationNode.resolve();
    return { resolved, streamTree, applicationRootPath, applicationNode };
  }

  private async auth(trustchain: Trustchain, memberCredentials: MemberCredentials): Promise<JWT> {
    const challenge = await this.api.getAuthenticationChallenge();
    const data = crypto.from_hex(challenge.tlv);
    const [parsed, _] = Challenge.fromBytes(data);
    const hash = await crypto.hash(parsed.getUnsignedTLV());
    const keypair = convertLiveCredentialsToKeyPair(memberCredentials);
    const response = await this.api
      .postChallengeResponse({
        challenge: challenge.json,
        signature: {
          credential: credentialForPubKey(memberCredentials.pubkey),
          signature: crypto.to_hex(await crypto.sign(hash, keypair)),
          attestation: crypto.to_hex(liveAuthentication(trustchain.rootId)),
        },
      })
      .catch(e => {
        if (
          e instanceof LedgerAPI4xx &&
          (e.message.includes("Not a member of trustchain") ||
            e.message.includes("You are not member"))
        ) {
          throw new TrustchainEjected(e.message);
        }
        throw e;
      });
    return response;
  }

  private async pushMember(
    streamTree: StreamTree,
    path: string,
    trustchainId: string,
    withJwt: WithJwt,
    withDevice: (job: (device: Device) => Promise<StreamTree>) => Promise<StreamTree>,
    member: TrustchainMember,
  ) {
    const isNewDerivation = !streamTree.getChild(path);
    streamTree = await withDevice(device =>
      streamTree.share(path, device, crypto.from_hex(member.id), member.name, member.permissions),
    );

    const child = streamTree.getChild(path);
    invariant(child, "StreamTree.share failed to create the child stream.");
    await child.resolve(); // double checks the signatures are correct before sending to the backend
    if (isNewDerivation) {
      const commandStream = CommandStreamEncoder.encode(child.blocks);
      await withJwt(jwt =>
        this.api.postDerivation(jwt, trustchainId, crypto.to_hex(commandStream)),
      );
    } else {
      const commandStream = CommandStreamEncoder.encode([child.blocks[child.blocks.length - 1]]);
      const request = {
        path,
        blocks: [crypto.to_hex(commandStream)],
      };
      await withJwt(jwt => this.api.putCommands(jwt, trustchainId, request));
    }
    return streamTree;
  }

  private async closeStream(
    streamTree: StreamTree,
    path: string,
    trustchainId: string,
    withJwt: WithJwt,
    withDevice: (job: (device: Device) => Promise<StreamTree>) => Promise<StreamTree>,
  ) {
    streamTree = await withDevice(device => streamTree.close(path, device));
    const child = streamTree.getChild(path);
    invariant(child, "StreamTree.close failed to create the child stream.");
    await child.resolve(); // double checks the signatures are correct before sending to the backend
    const commandStream = CommandStreamEncoder.encode([child.blocks[child.blocks.length - 1]]);
    const request = {
      path,
      blocks: [crypto.to_hex(commandStream)],
    };
    return () => withJwt(jwt => this.api.putCommands(jwt, trustchainId, request));
  }
}

export function convertKeyPairToLiveCredentials(keyPair: CryptoKeyPair): MemberCredentials {
  return {
    pubkey: crypto.to_hex(keyPair.publicKey),
    privatekey: crypto.to_hex(keyPair.privateKey),
  };
}

export function convertLiveCredentialsToKeyPair(
  memberCredentials: MemberCredentials,
): CryptoKeyPair {
  return {
    publicKey: crypto.from_hex(memberCredentials.pubkey),
    privateKey: crypto.from_hex(memberCredentials.privatekey),
  };
}

function getSoftwareDevice(memberCredentials: MemberCredentials): SoftwareDevice {
  const kp = convertLiveCredentialsToKeyPair(memberCredentials);
  return new SoftwareDevice(kp);
}

async function extractEncryptionKey(
  streamTree: StreamTree,
  path: string,
  memberCredentials: MemberCredentials,
): Promise<string> {
  const softwareDevice = getSoftwareDevice(memberCredentials);
  const pathNumbers = DerivationPath.toIndexArray(path);
  try {
    const key = await softwareDevice.readKey(streamTree, pathNumbers);
    // private key is in the first 32 bytes
    return crypto.to_hex(key.slice(0, 32));
  } catch (e) {
    if (e instanceof Error) {
      throw new TrustchainEjected(e.message);
    }
    throw e;
  }
}

// spec https://ledgerhq.atlassian.net/wiki/spaces/TA/pages/4335960138/ARCH+LedgerLive+Auth+specifications
function liveAuthentication(rootId: string): Uint8Array {
  const trustchainId = new TextEncoder().encode(rootId);
  const att = new Uint8Array(2 + trustchainId.length);
  att[0] = 0x02; // Prefix tag
  att[1] = trustchainId.length;
  att.set(trustchainId, 2);
  return att;
}

function credentialForPubKey(publicKey: string) {
  return { version: 0, curveId: 33, signAlgorithm: 1, publicKey };
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
