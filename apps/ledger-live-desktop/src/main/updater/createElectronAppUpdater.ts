import { UpdateFetchFileFail } from "../../errors";
import network from "@ledgerhq/live-network/network";
import createAppUpdater from "./createAppUpdater";
import pubKey from "./ledger-pubkey";
import { UpdateInfo } from "electron-updater";

// electron-updater rejects any download whose sha512 differs from the update info checked here.
export default function createElectronAppUpdater({
  feedURL,
  info,
}: {
  feedURL: string;
  info: UpdateInfo;
}) {
  const { version: updateVersion, files } = info;
  const hashFileURL = `${feedURL}/ledger-live-desktop-${updateVersion}.sha512sum`;
  const hashSigFileURL = `${feedURL}/ledger-live-desktop-${updateVersion}.sha512sum.sig`;
  const keysURL = `${feedURL}/pubkeys`;
  return createAppUpdater({
    files: files.map(file => ({
      filename: file.url,
      sha512Hex: Buffer.from(file.sha512, "base64").toString("hex"),
    })),
    getHashFile: () => getDistantFileContent(hashFileURL),
    getHashFileSignature: () => getDistantFileContent(hashSigFileURL, true),
    getNextKey: (fingerprint?: string | null) =>
      fingerprint
        ? getDistantFileContent(`${keysURL}/${fingerprint}.pem`)
        : Promise.resolve(pubKey),
    getNextKeySignature: async (fingerprint: string) =>
      getDistantFileContent(`${keysURL}/${fingerprint}.pem.sig`, true),
  });
}

async function getDistantFileContent(url: string, binary = false) {
  const query: { method: string; url: string; responseType?: string } = {
    method: "GET",
    url,
  };
  if (binary) {
    query.responseType = "arraybuffer";
  }
  try {
    // @ts-expect-error axios versions mismatch, so types mismatch…
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const res = await network(query);
    return res.data;
  } catch {
    throw new UpdateFetchFileFail(url);
  }
}
