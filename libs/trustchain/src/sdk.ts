import {
  JWT,
  LiveCredentials,
  TrustchainSDKContext,
  Trustchain,
  TrustchainMember,
  TrustchainSDK,
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
import { makeCipher } from "./wallet-sync-cipher";
import { log } from "@ledgerhq/logs";

export class SDK implements TrustchainSDK {
  context: TrustchainSDKContext;

  constructor(context: TrustchainSDKContext) {
    this.context = context;
  }

  async initLiveCredentials(): Promise<LiveCredentials> {
    const kp = await crypto.randomKeypair();
    return convertKeyPairToLiveCredentials(kp);
  }

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
    return response;
  }

  async liveAuthenticate(
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<JWT> {
    const challenge = await api.getAuthenticationChallenge();
    const data = crypto.from_hex(challenge.tlv);
    const [parsed, _] = Challenge.fromBytes(data);
    const hash = await crypto.hash(parsed.getUnsignedTLV());
    const keypair = convertLiveCredentialsToKeyPair(liveInstanceCredentials);
    const sig = await crypto.sign(hash, keypair);
    const signature = crypto.to_hex(sig);
    const credential = {
      version: 0,
      curveId: 33,
      signAlgorithm: 1,
      publicKey: liveInstanceCredentials.pubkey,
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
    seedIdToken: JWT,
    liveInstanceCredentials: LiveCredentials,
    topic?: Uint8Array,
  ): Promise<{
    jwt: JWT;
    trustchain: Trustchain;
  }> {
    const hw = device.apdu(transport);
    let jwt = seedIdToken;
    let trustchains = await api.getTrustchains(jwt);

    if (Object.keys(trustchains).length === 0) {
      log("trustchain", "getOrCreateTrustchain: no trustchain yet, let's create one");
      const streamTree = await StreamTree.createNewTree(hw, { topic });
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
      shouldShare = !members.some(m => crypto.to_hex(m) === liveInstanceCredentials.pubkey); // not already a member
    }
    if (shouldShare) {
      streamTree = await pushMember(streamTree, path, trustchainRootId, jwt, hw, {
        id: liveInstanceCredentials.pubkey,
        name: this.context.name,
        permissions: Permissions.OWNER,
      });
    }

    const walletSyncEncryptionKey = await extractEncryptionKey(
      streamTree,
      path,
      liveInstanceCredentials,
    );

    const trustchain = {
      rootId: trustchainRootId,
      walletSyncEncryptionKey,
      applicationPath: path,
    };

    return { jwt, trustchain };
  }

  async restoreTrustchain(
    liveJWT: JWT,
    trustchainId: string,
    liveInstanceCredentials: LiveCredentials,
  ): Promise<Trustchain> {
    const { streamTree, applicationRootPath } = await fetchTrustchainAndResolve(
      liveJWT,
      trustchainId,
      this.context.applicationId,
    );
    const walletSyncEncryptionKey = await extractEncryptionKey(
      streamTree,
      applicationRootPath,
      liveInstanceCredentials,
    );

    return {
      rootId: trustchainId,
      walletSyncEncryptionKey,
      applicationPath: applicationRootPath,
    };
  }

  async getMembers(liveJWT: JWT, trustchain: Trustchain): Promise<TrustchainMember[]> {
    const { resolved } = await fetchTrustchainAndResolve(
      liveJWT,
      trustchain.rootId,
      this.context.applicationId,
    );
    return resolved.getMembersData();
  }

  async removeMember(
    transport: Transport,
    seedIdToken: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
    member: TrustchainMember,
  ): Promise<{
    jwt: JWT;
    trustchain: Trustchain;
  }> {
    const hw = device.apdu(transport);
    const applicationId = this.context.applicationId;
    const trustchainId = trustchain.rootId;
    const m = await fetchTrustchainAndResolve(seedIdToken, trustchainId, applicationId);
    const members = m.resolved.getMembersData();
    const withoutMember = members.filter(m => m.id !== member.id);
    if (members.length === withoutMember.length) {
      throw new Error("member not found");
    }
    const withoutMemberOrMe = withoutMember.filter(m => m.id !== liveInstanceCredentials.pubkey);
    const softwareDevice = getSoftwareDevice(liveInstanceCredentials);

    let { streamTree } = m;
    const newPath = streamTree.getApplicationRootPath(applicationId, 1);

    // derive a new branch of the tree on the new path
    streamTree = await pushMember(streamTree, newPath, trustchainId, seedIdToken, hw, {
      id: liveInstanceCredentials.pubkey,
      name: this.context.name,
      permissions: Permissions.OWNER,
    });

    // add the remaining members
    for (const m of withoutMemberOrMe) {
      streamTree = await pushMember(
        streamTree,
        newPath,
        trustchainId,
        seedIdToken,
        softwareDevice,
        m,
      );
    }
    const walletSyncEncryptionKey = await extractEncryptionKey(
      streamTree,
      newPath,
      liveInstanceCredentials,
    );

    // TODO close previous node

    const jwt = await api.refreshAuth(seedIdToken);

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
    liveJWT: JWT,
    trustchain: Trustchain,
    liveInstanceCredentials: LiveCredentials,
    member: TrustchainMember,
  ): Promise<void> {
    const { streamTree, applicationRootPath } = await fetchTrustchainAndResolve(
      liveJWT,
      trustchain.rootId,
      this.context.applicationId,
    );
    const softwareDevice = getSoftwareDevice(liveInstanceCredentials);
    await pushMember(
      streamTree,
      applicationRootPath,
      trustchain.rootId,
      liveJWT,
      softwareDevice,
      member,
    );
  }

  async destroyTrustchain(trustchain: Trustchain, jwt: JWT): Promise<void> {
    await api.deleteTrustchain(jwt, trustchain.rootId);
  }

  async encryptUserData(trustchain: Trustchain, obj: object): Promise<Uint8Array> {
    const cipher = makeCipher(crypto.from_hex(trustchain.walletSyncEncryptionKey));
    const encrypted = await cipher.encrypt(obj);
    return encrypted;
  }

  async decryptUserData(trustchain: Trustchain, data: Uint8Array): Promise<object> {
    const cipher = makeCipher(crypto.from_hex(trustchain.walletSyncEncryptionKey));
    const decrypted = await cipher.decrypt(data);
    return decrypted;
  }
}

export function convertKeyPairToLiveCredentials(keyPair: CryptoKeyPair): LiveCredentials {
  return {
    pubkey: crypto.to_hex(keyPair.publicKey),
    privatekey: crypto.to_hex(keyPair.privateKey),
  };
}

export function convertLiveCredentialsToKeyPair(
  liveInstanceCredentials: LiveCredentials,
): CryptoKeyPair {
  return {
    publicKey: crypto.from_hex(liveInstanceCredentials.pubkey),
    privateKey: crypto.from_hex(liveInstanceCredentials.privatekey),
  };
}

function getSoftwareDevice(liveInstanceCredentials: LiveCredentials): SoftwareDevice {
  const kp = convertLiveCredentialsToKeyPair(liveInstanceCredentials);
  return new SoftwareDevice(kp);
}

async function fetchTrustchain(liveJWT: JWT, trustchainId: string) {
  const trustchainData = await api.getTrustchain(liveJWT, trustchainId);
  const streams = Object.values(trustchainData).map(
    data => new CommandStream(CommandStreamDecoder.decode(crypto.from_hex(data))),
  );
  const streamTree = StreamTree.from(...streams);
  return { streamTree };
}

async function fetchTrustchainAndResolve(
  liveJWT: JWT,
  trustchainId: string,
  applicationId: number,
) {
  const { streamTree } = await fetchTrustchain(liveJWT, trustchainId);
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
  liveInstanceCredentials: LiveCredentials,
): Promise<string> {
  const softwareDevice = getSoftwareDevice(liveInstanceCredentials);
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
