import { ICPCallRejected } from "../errors";
import { readTransferOutcome } from "./api";

// A mainnet synchronous /call answer to a transfer from an unfunded account: the ledger replied
// InsufficientFunds, certified by the subnet. It runs through the real certificate verification and
// the agent's embedded IC root key.
const REQUEST_ID_HEX = "73f2fe831215b9a10004db514a6b7f48407aa1ad7fbe4914327f49f16b133b4d";
const RESPONSE_HEX =
  "d9d9f7a266737461747573677265706c6965646b636572746966696361746559034cd9d9f7a26474726565830182045820369d6e0ae5a8940d2a0d2db22b5740b86383b04261567380ae744cd4e3333c2f8301830183024e726571756573745f7374617475738301830182045820ba87b0349dfe928face96f5d1b77b4063fbacf7fe76ad6d2c47ee9d88bc19c2a83018301830183018301830182045820959cb992c65a8009373b5127f4a2c4eaf77bd93d6307ce0d083ea5a45caa2b0d830182045820dc7bd4fcb7900f0825e9603a92c0e3959eff22ef2a8d813b73a175e07e0310b28301820458200742d9eb61b0585c8cc15ab40092528eecf5680be138e353d1e48abed1eb79ef830182045820cc3d7f2c057120610bb00deaa022efecccb9904f01e17d99cfb82a08880dca7583018302582073f2fe831215b9a10004db514a6b7f48407aa1ad7fbe4914327f49f16b133b4d83018302457265706c79820358624449444c076b02bc8a0178c5fed201016b05b79eb35d02a1c3ebfd0703c7c6b5f60a05cce5b6900f7feb9cdbd50f066c01a7a5f3cc0e786c01bf9bb7f00d046c01e0a9b302786c018bbdf29b01786c019cbab69c02040100010400000000000000008302467374617475738203477265706c6965648204582003e2b893586f4fd41e06f4aa304837ff99a3aeeb9070dea07fb1dab4e51d790f82045820302d5ca2b16e6888cd2c325f81da44d110d9ae2036bad37e1756f87920c1dc51820458204c6988b5b6966aceea670127ffdc08b0bf37f95ae68d635b9a84feb84c005de382045820ee20202c16f7c315988825ba4a1a5d3c5e7bd7c51225dd876e7885ed88204f2e82045820890d94601bd0b251070c365fb2ee236825700372e8cc1aa8bb5d95323e4a1986820458202fd862ccdcdddb71f0187f4c6f673c014bd62fe3da13902310b9ca59f11d74ee820458204b3662d87a2770ee96670c50295afec5f8fe8d2128bcda9fb6b4269186e38f2f820458201a5e56235a7a5a84c938404041d614fd6eec6a5d8bc825a372f325eb2a546c948301820458203132b0c4606158939de5ceab086a43df368beb2392e7a98363d9b46d63e3e2de83024474696d65820349ddf694c0a6a3a2f018697369676e617475726558308c5afab59e140e433d5237956b0f61d06bf2e39265deb91f3a1d3b0f0d1de2e0f0ff425bedf8c76104448eaf1a01a651";
// The certificate's `time` leaf.
const CERTIFIED_AT_MS = 1_792_583_398_200;

const response = () => new Uint8Array(Buffer.from(RESPONSE_HEX, "hex"));

describe("readTransferOutcome against a real certificate", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Verification must need nothing from the network: the root key is the embedded one.
    global.fetch = jest.fn(() => Promise.reject(new Error("unexpected network call")));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it("returns the ledger's verdict from a certificate that verifies", async () => {
    jest.useFakeTimers({ now: CERTIFIED_AT_MS, advanceTimers: true });

    const outcome = await readTransferOutcome(response(), REQUEST_ID_HEX);

    expect(outcome.Err).toHaveProperty("InsufficientFunds");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // The last bytes of the answer are the certificate's BLS signature.
  it("fails plainly when the certificate signature does not verify", async () => {
    jest.useFakeTimers({ now: CERTIFIED_AT_MS, advanceTimers: true });
    const tampered = response();
    tampered[tampered.length - 1] ^= 0x01;

    const attempt = readTransferOutcome(tampered, REQUEST_ID_HEX);

    await expect(attempt).rejects.toThrow(/signature/i);
    await expect(attempt).rejects.not.toBeInstanceOf(ICPCallRejected);
  });

  it("fails plainly when the certificate is older than the accepted age", async () => {
    jest.useFakeTimers({ now: CERTIFIED_AT_MS + 101 * 60_000, advanceTimers: true });

    const attempt = readTransferOutcome(response(), REQUEST_ID_HEX);

    await expect(attempt).rejects.toThrow(/more than 100 minutes in the past/);
    await expect(attempt).rejects.not.toBeInstanceOf(ICPCallRejected);
  });
});
