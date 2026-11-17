import { MockServer } from "./mock-server";

/** The APDU the Speculos transport sends to connect: Get App And Version. */
export const SPECULOS_CONNECT_APDU = "B0010000";

const OK = "9000";
const INS_NOT_SUPPORTED = "6d00";

/** A Ledger app as Speculos runs it: its name and version, and its reply to each APDU it knows. */
export type SpeculosApp = {
  name: string;
  version: string;
  /** Hex reply data without the status word, or `undefined` for an APDU the app doesn't know. */
  reply(apdu: string): string | undefined;
};

/** The Ethereum app, whose Get Address returns `address` for every path. */
export function ethereumApp(address: string): SpeculosApp {
  const publicKey = `04${"11".repeat(64)}`;
  const ascii = Buffer.from(address.slice(2)).toString("hex");
  return {
    name: "Ethereum",
    version: "1.13.0",
    reply: apdu => (apdu.startsWith("e002") ? `41${publicKey}28${ascii}` : undefined),
  };
}

/**
 * The Solana app, whose Get Address returns `publicKeyHex` for every path and which signs every
 * transaction with `signatureHex`. Records the transactions it signed.
 */
export function solanaApp(
  publicKeyHex: string,
  signatureHex: string,
): SpeculosApp & { signed: number } {
  const app = {
    name: "Solana",
    version: "1.10.0",
    signed: 0,
    reply: (apdu: string) => {
      if (apdu.startsWith("e004")) return "0100010a00";
      if (apdu.startsWith("e005")) return publicKeyHex;
      if (!apdu.startsWith("e006")) return undefined;
      app.signed += 1;
      return signatureHex;
    },
  };
  return app;
}

const lengthPrefixed = (text: string) =>
  Buffer.concat([Buffer.from([Buffer.byteLength(text)]), Buffer.from(text)]);

function appAndVersion({ name, version }: SpeculosApp): string {
  const format = Buffer.from([1]);
  const flags = Buffer.from([1, 0]);
  return Buffer.concat([format, lengthPrefixed(name), lengthPrefixed(version), flags]).toString(
    "hex",
  );
}

/**
 * Speculos as its HTTP API answers the DMK Speculos transport: `app` open, or else the HTTP
 * failure or silence a test set. Records every APDU it gets.
 */
export class FakeSpeculos {
  readonly apdus: string[] = [];
  private failure: number | null = null;
  private held: (() => void)[] = [];
  private hanging = false;
  private readonly server: MockServer;

  constructor(private readonly app: SpeculosApp) {
    this.server = new MockServer([
      {
        method: "POST",
        match: "/apdu",
        response: null,
        onRequest: request => this.answer(request),
      },
    ]);
  }

  start(): void {
    this.server.start();
  }

  stop(): void {
    this.release();
    this.server.stop();
  }

  get env(): { SPECULOS_API_PORT: string } {
    return { SPECULOS_API_PORT: String(this.server.port) };
  }

  get url(): string {
    return `http://127.0.0.1:${this.server.port}`;
  }

  /** Answers every APDU with this HTTP status until `reset()`. */
  failWith(status: number): void {
    this.failure = status;
  }

  /** Leaves every APDU unanswered until `reset()`, as an emulator stuck on a screen. */
  hang(): void {
    this.hanging = true;
  }

  reset(): void {
    this.apdus.length = 0;
    this.failure = null;
    this.hanging = false;
    this.release();
  }

  private release(): void {
    for (const answerHeld of this.held.splice(0)) answerHeld();
  }

  private async answer(request: Request): Promise<Response> {
    const { data } = (await request.json()) as { data: string };
    this.apdus.push(data);
    if (this.hanging) {
      await new Promise<void>(resolve => this.held.push(resolve));
    }
    if (this.failure !== null) return new Response("speculos error", { status: this.failure });
    return Response.json({ data: this.reply(data.toLowerCase()) });
  }

  private reply(apdu: string): string {
    if (apdu.startsWith("b001")) return appAndVersion(this.app) + OK;
    const data = this.app.reply(apdu);
    return data === undefined ? INS_NOT_SUPPORTED : data + OK;
  }
}
