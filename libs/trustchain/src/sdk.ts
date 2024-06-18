import {
  JWT,
  MemberCredentials,
  TrustchainSDKContext,
  Trustchain,
  TrustchainMember,
  TrustchainSDK,
  TrustchainDeviceCallbacks,
} from "./types";
import {
  crypto,
  device,
  Challenge,
  CommandStream,
  CommandStreamEncoder,
  CommandStreamDecoder,
  StreamTree,
  Permissions,
  DerivationPath,
  SoftwareDevice,
  Device,
} from "@ledgerhq/hw-trustchain";
import Transport from "@ledgerhq/hw-transport";
import api from "./api";
import { KeyPair as CryptoKeyPair } from "@ledgerhq/hw-trustchain/Crypto";
import { log } from "@ledgerhq/logs";

export class SDK implements TrustchainSDK {
  context: TrustchainSDKContext;

  constructor(context: TrustchainSDKContext) {
    this.context = context;
  }

  async initMemberCredentials(): Promise<MemberCredentials> {
    const kp = await crypto.randomKeypair();
    return convertKeyPairToLiveCredentials(kp);
  }

  async authWithDevice(transport: Transport): Promise<JWT> {
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
    return response;
  }

  async auth(trustchain: Trustchain, memberCredentials: MemberCredentials): Promise<JWT> {
    const challenge = await api.getAuthenticationChallenge();
    const data = crypto.from_hex(challenge.tlv);
    const [parsed, _] = Challenge.fromBytes(data);
    const hash = await crypto.hash(parsed.getUnsignedTLV());
    const keypair = convertLiveCredentialsToKeyPair(memberCredentials);
    const sig = await crypto.sign(hash, keypair);
    const signature = crypto.to_hex(sig);
    const credential = {
      version: 0,
      curveId: 33,
      signAlgorithm: 1,
      publicKey: memberCredentials.pubkey,
    };
    const trustchainId = new TextEncoder().encode(trustchain.rootId);
    const att = new Uint8Array(2 + trustchainId.length);
    att[0] = 0x02;
    att[1] = trustchainId.length;
    att.set(trustchainId, 2);
    const attestation = crypto.to_hex(att);
    const response = await api.postChallengeResponse({
      challenge: challenge.json,
      signature: {
        credential,
        signature,
        attestation,
      },
    });
    return response;
  }

  async getOrCreateTrustchain(
    transport: Transport,
    deviceJWT: JWT,
    memberCredentials: MemberCredentials,
    callbacks?: TrustchainDeviceCallbacks,
    topic?: Uint8Array,
  ): Promise<{
    jwt: JWT;
    trustchain: Trustchain;
  }> {
    const hw = device.apdu(transport);
    let jwt = deviceJWT;
    let trustchains = await api.getTrustchains(jwt);

    if (Object.keys(trustchains).length === 0) {
      log("trustchain", "getOrCreateTrustchain: no trustchain yet, let's create one");

      callbacks?.onStartRequestUserInteraction();
      const streamTree = await StreamTree.createNewTree(hw, { topic });
      callbacks?.onEndRequestUserInteraction();

      await streamTree.getRoot().resolve(); // double checks the signatures are correct before sending to the backend
      const commandStream = CommandStreamEncoder.encode(streamTree.getRoot().blocks);
      await api.postSeed(jwt, crypto.to_hex(commandStream));
      jwt = await api.refreshAuth(jwt);
      trustchains = await api.getTrustchains(jwt);
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
    if (!trustchainRootId) {
      throw new Error("can't find the trustchain root id");
    }

    // make a stream tree from all the trustchains associated to this root id
    let { streamTree } = await fetchTrustchain(jwt, trustchainRootId);

    const path = streamTree.getApplicationRootPath(this.context.applicationId);
    const child = streamTree.getChild(path);
    let shouldShare = true;
    if (child) {
      const resolved = await child.resolve();
      const members = resolved.getMembers();
      shouldShare = !members.some(m => crypto.to_hex(m) === memberCredentials.pubkey); // not already a member
    }
    if (shouldShare) {
      callbacks?.onStartRequestUserInteraction();
      streamTree = await pushMember(streamTree, path, trustchainRootId, jwt, hw, {
        id: memberCredentials.pubkey,
        name: this.context.name,
        permissions: Permissions.OWNER,
      });
      callbacks?.onEndRequestUserInteraction();
    }

    const walletSyncEncryptionKey = await extractEncryptionKey(streamTree, path, memberCredentials);

    const trustchain = {
      rootId: trustchainRootId,
      walletSyncEncryptionKey,
      applicationPath: path,
    };

    return { jwt, trustchain };
  }

  async restoreTrustchain(
    jwt: JWT,
    trustchainId: string,
    memberCredentials: MemberCredentials,
  ): Promise<Trustchain> {
    const { streamTree, applicationRootPath } = await fetchTrustchainAndResolve(
      jwt,
      trustchainId,
      this.context.applicationId,
    );
    const walletSyncEncryptionKey = await extractEncryptionKey(
      streamTree,
      applicationRootPath,
      memberCredentials,
    );

    return {
      rootId: trustchainId,
      walletSyncEncryptionKey,
      applicationPath: applicationRootPath,
    };
  }

  async getMembers(jwt: JWT, trustchain: Trustchain): Promise<TrustchainMember[]> {
    const { resolved } = await fetchTrustchainAndResolve(
      jwt,
      trustchain.rootId,
      this.context.applicationId,
    );
    return resolved.getMembersData();
  }

  async removeMember(
    transport: Transport,
    deviceJWT: JWT,
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    member: TrustchainMember,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<{
    jwt: JWT;
    trustchain: Trustchain;
  }> {
    const hw = device.apdu(transport);
    const applicationId = this.context.applicationId;
    const trustchainId = trustchain.rootId;
    const m = await fetchTrustchainAndResolve(deviceJWT, trustchainId, applicationId);
    const members = m.resolved.getMembersData();
    const withoutMember = members.filter(m => m.id !== member.id);
    if (members.length === withoutMember.length) {
      throw new Error("member not found");
    }
    const withoutMemberOrMe = withoutMember.filter(m => m.id !== memberCredentials.pubkey);
    const softwareDevice = getSoftwareDevice(memberCredentials);

    let { streamTree } = m;
    const newPath = streamTree.getApplicationRootPath(applicationId, 1);

    // derive a new branch of the tree on the new path
    callbacks?.onStartRequestUserInteraction();
    streamTree = await pushMember(streamTree, newPath, trustchainId, deviceJWT, hw, {
      id: memberCredentials.pubkey,
      name: this.context.name,
      permissions: Permissions.OWNER,
    });
    callbacks?.onEndRequestUserInteraction();

    // add the remaining members
    for (const m of withoutMemberOrMe) {
      streamTree = await pushMember(
        streamTree,
        newPath,
        trustchainId,
        deviceJWT,
        softwareDevice,
        m,
      );
    }
    const walletSyncEncryptionKey = await extractEncryptionKey(
      streamTree,
      newPath,
      memberCredentials,
    );

    // close the previous stream
    streamTree = await closeStream(
      streamTree,
      m.applicationRootPath,
      trustchainId,
      deviceJWT,
      softwareDevice,
    );

    const jwt = await api.refreshAuth(deviceJWT);

    return {
      jwt,
      trustchain: {
        rootId: trustchainId,
        walletSyncEncryptionKey,
        applicationPath: newPath,
      },
    };
  }

  async addMember(
    jwt: JWT,
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    member: TrustchainMember,
  ): Promise<void> {
    const { streamTree, applicationRootPath } = await fetchTrustchainAndResolve(
      jwt,
      trustchain.rootId,
      this.context.applicationId,
    );
    const softwareDevice = getSoftwareDevice(memberCredentials);
    await pushMember(
      streamTree,
      applicationRootPath,
      trustchain.rootId,
      jwt,
      softwareDevice,
      member,
    );
  }

  async destroyTrustchain(trustchain: Trustchain, jwt: JWT): Promise<void> {
    await api.deleteTrustchain(jwt, trustchain.rootId);
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

async function fetchTrustchain(jwt: JWT, trustchainId: string) {
  const trustchainData = await api.getTrustchain(jwt, trustchainId);
  const streams = Object.values(trustchainData).map(
    data => new CommandStream(CommandStreamDecoder.decode(crypto.from_hex(data))),
  );
  const streamTree = StreamTree.from(...streams);
  return { streamTree };
}

async function fetchTrustchainAndResolve(jwt: JWT, trustchainId: string, applicationId: number) {
  const { streamTree } = await fetchTrustchain(jwt, trustchainId);
  const applicationRootPath = streamTree.getApplicationRootPath(applicationId);
  const applicationNode = streamTree.getChild(applicationRootPath);
  if (!applicationNode) {
    throw new Error("could not find the application stream.");
  }
  const resolved = await applicationNode.resolve();
  return { resolved, streamTree, applicationRootPath, applicationNode };
}

async function extractEncryptionKey(
  streamTree: StreamTree,
  path: string,
  memberCredentials: MemberCredentials,
): Promise<string> {
  const softwareDevice = getSoftwareDevice(memberCredentials);
  const pathNumbers = DerivationPath.toIndexArray(path);
  const key = await softwareDevice.readKey(streamTree, pathNumbers);
  // private key is in the first 32 bytes
  return crypto.to_hex(key.slice(0, 32));
}

async function pushMember(
  streamTree: StreamTree,
  path: string,
  trustchainId: string,
  jwt: JWT,
  hw: Device,
  member: TrustchainMember,
) {
  const isNewDerivation = !streamTree.getChild(path);
  streamTree = await streamTree.share(
    path,
    hw,
    crypto.from_hex(member.id),
    member.name,
    member.permissions,
  );
  const child = streamTree.getChild(path);
  if (!child) {
    throw new Error("StreamTree.share failed to create the child stream.");
  }
  await child.resolve(); // double checks the signatures are correct before sending to the backend
  if (isNewDerivation) {
    const commandStream = CommandStreamEncoder.encode(child.blocks);
    await api.postDerivation(jwt, trustchainId, crypto.to_hex(commandStream));
  } else {
    const commandStream = CommandStreamEncoder.encode([child.blocks[child.blocks.length - 1]]);
    await api.putCommands(jwt, trustchainId, {
      path,
      blocks: [crypto.to_hex(commandStream)],
    });
  }
  return streamTree;
}

async function closeStream(
  streamTree: StreamTree,
  path: string,
  trustchainId: string,
  jwt: JWT,
  softwareDevice: Device,
) {
  streamTree = await streamTree.close(path, softwareDevice);
  const child = streamTree.getChild(path);
  if (!child) {
    throw new Error("StreamTree.close failed to create the child stream.");
  }
  await child.resolve(); // double checks the signatures are correct before sending to the backend
  const commandStream = CommandStreamEncoder.encode([child.blocks[child.blocks.length - 1]]);
  await api.putCommands(jwt, trustchainId, {
    path,
    blocks: [crypto.to_hex(commandStream)],
  });
  return streamTree;
}
