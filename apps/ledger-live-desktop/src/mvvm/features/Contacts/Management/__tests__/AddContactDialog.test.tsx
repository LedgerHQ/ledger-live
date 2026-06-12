import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import { AddContactDialog } from "../components/AddContactDialog";

/**
 * `jest.polyfills.js` replaces the global `Blob`/`File` with the
 * `node:buffer` implementations (MSW needs them), which jsdom's real
 * `FileReader` rejects ("parameter 1 is not of type 'Blob'"). Stub a
 * minimal async FileReader so the component's read path works under
 * tests exactly like in the Electron renderer.
 */
class StubFileReader {
  onload: (() => void) | null = null;
  result: string | ArrayBuffer | null = null;
  readAsDataURL(file: File) {
    this.result = `data:${file.type};base64,c3R1Yg==`;
    setTimeout(() => this.onload?.(), 0);
  }
}
const RealFileReader = window.FileReader;
beforeAll(() => {
  Object.defineProperty(window, "FileReader", {
    value: StubFileReader,
    writable: true,
    configurable: true,
  });
});
afterAll(() => {
  Object.defineProperty(window, "FileReader", {
    value: RealFileReader,
    writable: true,
    configurable: true,
  });
});

/**
 * Drive the hidden file input directly with `fireEvent.change` —
 * `user.upload` filters through the `accept` attribute, but the
 * component's own MIME/size validation is exactly what these tests
 * exercise, so we bypass the browser-level filter.
 */
const pickFile = (file: File) => {
  fireEvent.change(screen.getByTestId("contacts-management-contact-photo-input"), {
    target: { files: [file] },
  });
};

const pngFile = (overrides: { size?: number } = {}) => {
  const file = new File(["png-bytes"], "avatar.png", { type: "image/png" });
  if (overrides.size !== undefined) {
    Object.defineProperty(file, "size", { value: overrides.size });
  }
  return file;
};

const baseProps = (overrides: Partial<React.ComponentProps<typeof AddContactDialog>> = {}) => ({
  open: true,
  onOpenChange: jest.fn(),
  onSubmit: jest.fn(),
  takenNames: ["Alice", "Bob"],
  ...overrides,
});

describe("AddContactDialog", () => {
  it("renders nothing when `open` is false", () => {
    render(<AddContactDialog {...baseProps({ open: false })} />);
    expect(screen.queryByTestId("contacts-management-add-contact-dialog")).not.toBeInTheDocument();
  });

  it("renders the privacy guidance banner above the submit button (Figma 14201:12756)", () => {
    render(<AddContactDialog {...baseProps()} />);

    const banner = screen.getByTestId(
      "contacts-management-add-contact-privacy-banner",
    );
    expect(banner).toBeInTheDocument();
    // The banner copy is wired to the i18n key
    // `contactsManagement.addContactDialog.privacyBanner` — assert the
    // visible text rather than the raw key so a future copy edit
    // doesn't silently strip the surfaced guidance.
    expect(banner).toHaveTextContent(/For your privacy, avoid full names/i);
    expect(banner).toHaveTextContent(/John S\./);

    // Layout contract: the banner sits between the input/counter group
    // and the submit button. `compareDocumentPosition` returns the
    // bitmask `Node.DOCUMENT_POSITION_FOLLOWING` (4) when the second
    // argument follows the first — so the banner must follow the
    // input AND precede the submit.
    const input = screen.getByTestId("contacts-management-add-contact-name");
    const submit = screen.getByTestId(
      "contacts-management-add-contact-submit",
    );
    /* eslint-disable no-bitwise */
    expect(
      input.compareDocumentPosition(banner) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      banner.compareDocumentPosition(submit) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    /* eslint-enable no-bitwise */
  });

  it("renders an empty name input and a disabled submit on first open", () => {
    render(<AddContactDialog {...baseProps()} />);

    const input = screen.getByTestId("contacts-management-add-contact-name") as HTMLInputElement;
    const submit = screen.getByTestId(
      "contacts-management-add-contact-submit",
    ) as HTMLButtonElement;

    expect(input.value).toBe("");
    expect(submit).toBeDisabled();
  });

  it("enables the submit button once a valid name is typed", async () => {
    const { user } = render(<AddContactDialog {...baseProps()} />);

    const input = screen.getByTestId("contacts-management-add-contact-name");
    await user.type(input, "Charlie");

    expect(screen.getByTestId("contacts-management-add-contact-submit")).toBeEnabled();
  });

  it("keeps submit disabled when the name matches an existing contact (case-insensitive)", async () => {
    const { user } = render(<AddContactDialog {...baseProps()} />);

    const input = screen.getByTestId("contacts-management-add-contact-name");
    await user.type(input, "alice");

    expect(screen.getByTestId("contacts-management-add-contact-submit")).toBeDisabled();
  });

  it("calls onSubmit with the trimmed name when submit is clicked", async () => {
    const onSubmit = jest.fn();
    const { user } = render(<AddContactDialog {...baseProps({ onSubmit })} />);

    await user.type(screen.getByTestId("contacts-management-add-contact-name"), "  Charlie  ");
    await user.click(screen.getByTestId("contacts-management-add-contact-submit"));

    expect(onSubmit).toHaveBeenCalledWith("Charlie", undefined);
  });

  it("submits on Enter inside the input", async () => {
    const onSubmit = jest.fn();
    const { user } = render(<AddContactDialog {...baseProps({ onSubmit })} />);

    const input = screen.getByTestId("contacts-management-add-contact-name");
    await user.type(input, "Charlie{Enter}");

    expect(onSubmit).toHaveBeenCalledWith("Charlie", undefined);
  });

  it("blocks names ending with ' (Me)' — the suffix is reserved for the Me identity", async () => {
    const onSubmit = jest.fn();
    const { user } = render(<AddContactDialog {...baseProps({ onSubmit })} />);

    const input = screen.getByTestId("contacts-management-add-contact-name") as HTMLInputElement;
    await user.type(input, "Brian (Me)");

    // The aria-invalid flag is the contract here — the Lumen
    // `errorMessage` prop is wired up but the pinned Lumen version
    // doesn't actually render it (pre-existing type/render gap we
    // hit elsewhere). Submit-disabled + aria-invalid is what guards
    // the user.
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByTestId("contacts-management-add-contact-submit")).toBeDisabled();

    // Enter must also be inert — the keyboard path shouldn't bypass the
    // disabled-button check.
    await user.type(input, "{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does NOT fire onSubmit on Enter when the name is invalid", async () => {
    const onSubmit = jest.fn();
    const { user } = render(<AddContactDialog {...baseProps({ onSubmit })} />);

    const input = screen.getByTestId("contacts-management-add-contact-name");
    // duplicate (collides with the "Bob" name in takenNames)
    await user.type(input, "Bob{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("resets the input and the picture when the dialog is re-opened", async () => {
    const { rerender, user } = render(<AddContactDialog {...baseProps()} />);

    await user.type(screen.getByTestId("contacts-management-add-contact-name"), "Charlie");
    expect(
      (screen.getByTestId("contacts-management-add-contact-name") as HTMLInputElement).value,
    ).toBe("Charlie");
    pickFile(pngFile());
    await screen.findByTestId("contacts-management-contact-photo-preview");

    rerender(<AddContactDialog {...baseProps({ open: false })} />);
    rerender(<AddContactDialog {...baseProps({ open: true })} />);

    expect(
      (screen.getByTestId("contacts-management-add-contact-name") as HTMLInputElement).value,
    ).toBe("");
    expect(
      screen.queryByTestId("contacts-management-contact-photo-preview"),
    ).not.toBeInTheDocument();
  });

  describe("picture upload", () => {
    it("shows the placeholder avatar, upload button, and format hint by default", () => {
      render(<AddContactDialog {...baseProps()} />);

      expect(
        screen.getByTestId("contacts-management-contact-photo-placeholder"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("contacts-management-contact-photo-upload"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("contacts-management-contact-photo-hint")).toHaveTextContent(
        "File: JPG, JPEG, PNG - Max size: 2MB",
      );
      // No picture yet → no preview, no remove button.
      expect(
        screen.queryByTestId("contacts-management-contact-photo-preview"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("contacts-management-contact-photo-remove"),
      ).not.toBeInTheDocument();
    });

    it("previews an accepted picture and submits it as a data URL", async () => {
      const onSubmit = jest.fn();
      const { user } = render(<AddContactDialog {...baseProps({ onSubmit })} />);

      pickFile(pngFile());

      // FileReader resolves asynchronously → findBy.
      const preview = await screen.findByTestId("contacts-management-contact-photo-preview");
      expect(preview).toHaveAttribute("src", expect.stringMatching(/^data:image\/png/));
      expect(
        screen.queryByTestId("contacts-management-contact-photo-placeholder"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId("contacts-management-contact-photo-remove"),
      ).toBeInTheDocument();

      await user.type(screen.getByTestId("contacts-management-add-contact-name"), "Charlie");
      await user.click(screen.getByTestId("contacts-management-add-contact-submit"));
      expect(onSubmit).toHaveBeenCalledWith(
        "Charlie",
        expect.stringMatching(/^data:image\/png/),
      );
    });

    it("rejects a non-JPG/PNG file with a format error", async () => {
      render(<AddContactDialog {...baseProps()} />);

      pickFile(new File(["gif-bytes"], "avatar.gif", { type: "image/gif" }));

      expect(
        await screen.findByTestId("contacts-management-contact-photo-hint"),
      ).toHaveTextContent(/Unsupported file/);
      expect(
        screen.queryByTestId("contacts-management-contact-photo-preview"),
      ).not.toBeInTheDocument();
    });

    it("rejects a file over 2MB with a size error", async () => {
      render(<AddContactDialog {...baseProps()} />);

      pickFile(pngFile({ size: 2 * 1024 * 1024 + 1 }));

      expect(
        await screen.findByTestId("contacts-management-contact-photo-hint"),
      ).toHaveTextContent(/too large/);
      expect(
        screen.queryByTestId("contacts-management-contact-photo-preview"),
      ).not.toBeInTheDocument();
    });

    it("keeps a previously accepted picture when a later pick is rejected", async () => {
      render(<AddContactDialog {...baseProps()} />);

      pickFile(pngFile());
      await screen.findByTestId("contacts-management-contact-photo-preview");

      pickFile(new File(["gif-bytes"], "avatar.gif", { type: "image/gif" }));

      // Error shown, but the accepted preview survives.
      expect(
        await screen.findByTestId("contacts-management-contact-photo-hint"),
      ).toHaveTextContent(/Unsupported file/);
      expect(
        screen.getByTestId("contacts-management-contact-photo-preview"),
      ).toBeInTheDocument();
    });

    it("removes the selected picture and submits without one", async () => {
      const onSubmit = jest.fn();
      const { user } = render(<AddContactDialog {...baseProps({ onSubmit })} />);

      pickFile(pngFile());
      await screen.findByTestId("contacts-management-contact-photo-preview");

      await user.click(screen.getByTestId("contacts-management-contact-photo-remove"));

      expect(
        screen.queryByTestId("contacts-management-contact-photo-preview"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId("contacts-management-contact-photo-placeholder"),
      ).toBeInTheDocument();

      await user.type(screen.getByTestId("contacts-management-add-contact-name"), "Charlie");
      await user.click(screen.getByTestId("contacts-management-add-contact-submit"));
      expect(onSubmit).toHaveBeenCalledWith("Charlie", undefined);
    });
  });
});
