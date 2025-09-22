import {
  type CommandBlock,
  CommandStreamEncoder,
  crypto,
  SoftwareDevice,
  StreamTree,
} from "@ledgerhq/hw-ledger-key-ring-protocol";

import { getSdk } from "../src";
import getApi from "../src/api";
import { convertLiveCredentialsToKeyPair } from "../src/sdk";
import { JWT, MemberCredentials, Trustchain, TrustchainSDK, WithDevice } from "../src/types";

const CONTEXT = {
  applicationId: 16,
  name: "Test add member",
  apiBaseUrl: "https://trustchain-backend.api.aws.stg.ldg-tech.com",
};

process.stdin.resume();
process.stdin.setEncoding("utf-8");
let identStr = "";

process.stdout.write(
  'Parse your identity JSON ({ "trustchain": Trustchain , "memberCredentials": MemberCredentials }):\n',
);

process.stdin.on("data", function (input) {
  identStr += input;
  try {
    JSON.parse(identStr);
    process.stdin.emit("end");
  } catch {
    // ignore
  }
});

process.stdin.on("end", function () {
  process.stdin.pause();
  process.stdout.write("Adding member");

  const { trustchain, memberCredentials: initialKeypair } = JSON.parse(identStr);

  const withDevice: WithDevice = () => {
    throw new Error("Not implemented");
  };
  const sdk = getSdk(false, CONTEXT, withDevice);
  const api = getApi(CONTEXT.apiBaseUrl);
  addBadMember(sdk, api, trustchain, initialKeypair);
});

async function addBadMember(
  sdk: TrustchainSDK,
  api: ReturnType<typeof getApi>,
  trustchain: Trustchain,
  initialKeypair: MemberCredentials,
) {
  const withJwt = <T>(job: (jwt: JWT) => Promise<T>) =>
    sdk.withAuth(trustchain, initialKeypair, job);

  const streamTree = StreamTree.deserialize(
    await withJwt(jwt => api.getTrustchain(jwt, trustchain.rootId)),
  );

  const device = new SoftwareDevice(convertLiveCredentialsToKeyPair(initialKeypair));
  const path = trustchain.applicationPath;
  const block = await getBadMember(sdk, path, device, streamTree);

  const commandStream = CommandStreamEncoder.encode([block]);
  const request = {
    path,
    blocks: [crypto.to_hex(commandStream)],
  };
  await withJwt(jwt => api.putCommands(jwt, trustchain.rootId, request));
}

async function getBadMember(
  sdk: TrustchainSDK,
  path: string,
  device: SoftwareDevice,
  streamTree: StreamTree,
): Promise<CommandBlock> {
  for (let i = 0; i < 100_000; i++) {
    if (i % 5 === 0) process.stdout.write(".");

    const credentials = await sdk.initMemberCredentials();
    const name = credentials.pubkey.slice(0, 4);
    const pubkey = crypto.from_hex(credentials.pubkey);
    const candidate = await streamTree.share(path, device, pubkey, name, 0xffffffff);

    const child = candidate.getChild(path);
    const block = child?.blocks.at(-1);
    if (!child || !block) throw new Error("Missing stream or block");

    const padded = paddSig(block.signature);
    const isBad = [padded.r, padded.s].some(
      component => component.length === 32 && component[0] === 0 && component[1] < 0x80,
    );
    if (!isBad) continue;

    block.signature = padded.signature;
    process.stdout.write(`Found bad sig in ${i} tries!\n${crypto.to_hex(block.signature)}\n`);

    try {
      await child.resolve(); // double checks the signatures are correct before sending to the backend
    } catch (e) {
      console.error(
        [
          "Error with the signature",
          crypto.to_hex(block.signature),
          crypto.to_hex(Uint8Array.from(padded.r)),
          crypto.to_hex(Uint8Array.from(padded.s)),
        ].join("\n"),
      );
      throw e;
    }
    return block;
  }
  throw new Error("No bad member found");
}

function paddSig(sig: Uint8Array) {
  const orig = derDecode(sig);
  const rPad = Math.max(0, 32 - orig.r.length);
  const sPad = Math.max(0, 32 - orig.s.length);
  const r = [...Array.from({ length: rPad }, () => 0), ...orig.r];
  const s = [...Array.from({ length: sPad }, () => 0), ...orig.s];
  const rComponent = [0x02, r.length, ...r];
  const sComponent = [0x02, s.length, ...s];
  const signature = Uint8Array.from([
    0x30,
    rComponent.length + sComponent.length,
    ...rComponent,
    ...sComponent,
  ]);
  return { signature, r, s };
}

// Decode from DER format without the tlv header unlike `crypto.derDecode`
function derDecode(signature: Uint8Array): { r: number[]; s: number[] } {
  const [_tag, _len, _rTag, rLen, ...rest] = Array.from(signature);
  const r = rest.slice(0, rLen);
  const [_sTag, _sLen, ...s] = rest.slice(rLen);
  return { r, s };
}
