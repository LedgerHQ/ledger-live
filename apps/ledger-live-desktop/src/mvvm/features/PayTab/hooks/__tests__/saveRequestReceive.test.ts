import { toPng } from "html-to-image";
import { files } from "~/renderer/bridge";
import logger from "~/renderer/logger";
import { saveRequestReceive } from "../saveRequestReceive";

jest.mock("html-to-image", () => ({ toPng: jest.fn() }), { virtual: true });

jest.mock("~/renderer/logger", () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

const mockedToPng = jest.mocked(toPng);
const mockedSavePng = jest.mocked(files.savePng);
const mockedLoggerError = jest.mocked(logger.error);

const SUMMARY_HTML = '<div data-testid="pay-request-receive-summary">card</div>';
const DATA_URL = "data:image/png;base64,ABC123";

describe("saveRequestReceive", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = SUMMARY_HTML;
    mockedToPng.mockResolvedValue(DATA_URL);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should save the PNG with dialog options and base64 when capturing succeeds", async () => {
    mockedSavePng.mockResolvedValueOnce(true);

    await saveRequestReceive("USDC", "Save request card");

    expect(mockedSavePng).toHaveBeenCalledTimes(1);
    expect(mockedSavePng).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Save request card",
        defaultPath: "ledger-request-USDC.png",
        filters: [{ name: "PNG Image", extensions: ["png"] }],
      }),
      "ABC123",
    );
    expect(mockedLoggerError).not.toHaveBeenCalled();
  });

  it("should do nothing when the card node is missing", async () => {
    document.body.innerHTML = "";

    await saveRequestReceive("USDC", "Save request card");

    expect(mockedToPng).not.toHaveBeenCalled();
    expect(mockedSavePng).not.toHaveBeenCalled();
  });

  it("should swallow and log capture failures", async () => {
    const error = new Error("capture failed");
    mockedToPng.mockRejectedValueOnce(error);

    await saveRequestReceive("USDC", "Save request card");

    expect(mockedSavePng).not.toHaveBeenCalled();
    expect(mockedLoggerError).toHaveBeenCalledWith(error);
  });
});
