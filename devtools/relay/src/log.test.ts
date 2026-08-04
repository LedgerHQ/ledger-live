import { createWriteStream } from "node:fs";
import { createLogger } from "./log";

jest.mock("node:fs");

const mockCreateWriteStream = jest.mocked(createWriteStream);

function mockStream() {
  const stream = { write: jest.fn(), end: jest.fn() };
  mockCreateWriteStream.mockReturnValue(stream as any);
  return stream;
}

describe("createLogger — console mode", () => {
  let spyLog: jest.SpyInstance;
  let spyWarn: jest.SpyInstance;
  let spyStdout: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    spyLog = jest.spyOn(console, "log").mockImplementation(() => {});
    spyWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    spyStdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    spyLog.mockRestore();
    spyWarn.mockRestore();
    spyStdout.mockRestore();
  });

  it("routes log to console.log", () => {
    createLogger({}).log("hello");
    expect(spyLog).toHaveBeenCalledWith("hello");
  });

  it("routes warn to console.warn", () => {
    createLogger({}).warn("oops");
    expect(spyWarn).toHaveBeenCalledWith("oops");
  });

  it("trace calls log when verbose is true (default)", () => {
    createLogger({ verbose: true }).trace("tracing");
    expect(spyLog).toHaveBeenCalledWith("tracing");
  });

  it("trace is silent when verbose is false", () => {
    createLogger({ verbose: false }).trace("tracing");
    expect(spyLog).not.toHaveBeenCalled();
  });

  it("routes write to process.stdout.write", () => {
    createLogger({}).write("raw");
    expect(spyStdout).toHaveBeenCalledWith("raw");
  });

  it("close is a no-op when there is no stream", () => {
    expect(() => createLogger({}).close()).not.toThrow();
  });
});

describe("createLogger — file mode", () => {
  beforeEach(() => jest.clearAllMocks());

  it("opens the file with append flag", () => {
    mockStream();
    createLogger({ logFile: "/tmp/relay.log" });
    expect(mockCreateWriteStream).toHaveBeenCalledWith("/tmp/relay.log", { flags: "a" });
  });

  it("log writes the message with a trailing newline", () => {
    const stream = mockStream();
    createLogger({ logFile: "/tmp/relay.log" }).log("hello");
    expect(stream.write).toHaveBeenCalledWith("hello\n");
  });

  it("warn writes the message with [warn] prefix and newline", () => {
    const stream = mockStream();
    createLogger({ logFile: "/tmp/relay.log" }).warn("oops");
    expect(stream.write).toHaveBeenCalledWith("[warn] oops\n");
  });

  it("write routes to stream.write without adding a newline", () => {
    const stream = mockStream();
    createLogger({ logFile: "/tmp/relay.log" }).write("raw");
    expect(stream.write).toHaveBeenCalledWith("raw");
  });

  it("close calls stream.end", () => {
    const stream = mockStream();
    createLogger({ logFile: "/tmp/relay.log" }).close();
    expect(stream.end).toHaveBeenCalledTimes(1);
  });
});
