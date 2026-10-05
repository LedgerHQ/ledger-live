import { downloadJson } from "./files";

describe("downloadJson", () => {
  const createObjectURL = jest.fn(() => "blob:manifest");
  const revokeObjectURL = jest.fn();

  beforeAll(() => {
    Object.assign(URL, { createObjectURL, revokeObjectURL });
  });

  it("clicks a download link for the contents, then releases the blob URL", async () => {
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.href).toBe("blob:manifest");
        expect(this.download).toBe("app-manifest.json");
      });

    downloadJson("app-manifest.json", '{"id":"app"}');

    expect(click).toHaveBeenCalledTimes(1);
    const [blob] = createObjectURL.mock.calls[0] as unknown as [Blob];
    expect(blob.type).toBe("application/json");
    await expect(blob.text()).resolves.toBe('{"id":"app"}');
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:manifest");
    click.mockRestore();
  });
});
