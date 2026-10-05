import React from "react";
import { fireEvent, render, screen, waitFor } from "tests/testSetup";
import { downloadJson } from "~/renderer/files";
import RunLocalAppButton from "./RunLocalAppButton";

const addLocalManifest = jest.fn();
let localLiveApps: Array<{ id: string; name: string; url: string }> = [];

jest.mock("~/renderer/files", () => ({ downloadJson: jest.fn() }));

jest.mock("@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index", () => ({
  useLocalLiveAppContext: () => ({
    addLocalManifest,
    state: localLiveApps,
    removeLocalManifestById: jest.fn(),
  }),
}));

const pickFile = (contents: string) => {
  const input = screen.getByTestId("settings-import-local-manifest-input");
  const file = new File([contents], "manifest.json", { type: "application/json" });
  fireEvent.change(input, { target: { files: [file] } });
};

describe("RunLocalAppButton", () => {
  beforeEach(() => {
    addLocalManifest.mockClear();
    jest.mocked(downloadJson).mockClear();
    localLiveApps = [];
  });

  it("adds the manifest from the picked file", async () => {
    render(<RunLocalAppButton />);
    pickFile(JSON.stringify({ id: "local-app" }));

    await waitFor(() => expect(addLocalManifest).toHaveBeenCalledWith({ id: "local-app" }));
  });

  it("adds every manifest of a picked array", async () => {
    render(<RunLocalAppButton />);
    pickFile(JSON.stringify([{ id: "a" }, { id: "b" }]));

    await waitFor(() => expect(addLocalManifest).toHaveBeenCalledTimes(2));
    expect(addLocalManifest).toHaveBeenNthCalledWith(2, { id: "b" });
  });

  it("ignores a file that is not JSON", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    render(<RunLocalAppButton />);
    pickFile("not json");

    await waitFor(() => expect(log).toHaveBeenCalled());
    expect(addLocalManifest).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("downloads a local manifest as named JSON", async () => {
    const manifest = { id: "local-app", name: "Local App", url: "http://localhost:3000" };
    localLiveApps = [manifest];
    const { user } = render(<RunLocalAppButton />);

    await user.click(screen.getByTestId("settings-export-local-manifest"));

    expect(downloadJson).toHaveBeenCalledWith(
      "Local App-manifest.json",
      JSON.stringify(manifest, null, 2),
    );
  });
});
