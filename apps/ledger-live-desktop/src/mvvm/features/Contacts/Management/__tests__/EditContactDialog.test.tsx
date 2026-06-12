import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import { EditContactDialog } from "../components/EditContactDialog";

/**
 * Same FileReader stub as AddContactDialog.test — `jest.polyfills.js`
 * replaces the global `Blob`/`File` with the `node:buffer`
 * implementations (MSW needs them), which jsdom's real `FileReader`
 * rejects.
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

const pickFile = (file: File) => {
  fireEvent.change(screen.getByTestId("contacts-management-contact-photo-input"), {
    target: { files: [file] },
  });
};

const pngFile = () => new File(["png-bytes"], "avatar.png", { type: "image/png" });

// Stub the device runner — keeps the tests off DMK plumbing. The dialog
// only needs to know the runner mounted and (optionally) trigger
// `onDone` for the recovery path.
jest.mock(
  "~/mvvm/features/Contacts/components/RunDeviceAction",
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="contacts-management-edit-contact-device-stub" />
    ),
  }),
);

const baseProps = (overrides: Partial<React.ComponentProps<typeof EditContactDialog>> = {}) => ({
  open: true,
  onOpenChange: jest.fn(),
  currentName: "Alice",
  onSubmit: jest.fn(),
  takenNames: ["Bob", "Charlie"], // exclude current name
  ...overrides,
});

describe("EditContactDialog", () => {
  it("pre-fills the input with the current name", () => {
    render(<EditContactDialog {...baseProps()} />);

    const input = screen.getByTestId(
      "contacts-management-edit-contact-name",
    ) as HTMLInputElement;
    expect(input.value).toBe("Alice");
  });

  it("disables submit when the name is unchanged (no-op rename)", () => {
    render(<EditContactDialog {...baseProps()} />);

    expect(screen.getByTestId("contacts-management-edit-contact-submit")).toBeDisabled();
  });

  it("enables submit once the name is meaningfully edited", async () => {
    const { user } = render(<EditContactDialog {...baseProps()} />);

    const input = screen.getByTestId("contacts-management-edit-contact-name");
    await user.clear(input);
    await user.type(input, "Alicia");

    expect(screen.getByTestId("contacts-management-edit-contact-submit")).toBeEnabled();
  });

  it("blocks submit when the new name collides with another contact (case-insensitive)", async () => {
    const { user } = render(<EditContactDialog {...baseProps()} />);

    const input = screen.getByTestId("contacts-management-edit-contact-name");
    await user.clear(input);
    await user.type(input, "bob");

    expect(screen.getByTestId("contacts-management-edit-contact-submit")).toBeDisabled();
  });

  it("calls onSubmit with the trimmed new name", async () => {
    const onSubmit = jest.fn();
    const { user } = render(<EditContactDialog {...baseProps({ onSubmit })} />);

    const input = screen.getByTestId("contacts-management-edit-contact-name");
    await user.clear(input);
    await user.type(input, "  Alicia  ");
    await user.click(screen.getByTestId("contacts-management-edit-contact-submit"));

    expect(onSubmit).toHaveBeenCalledWith("Alicia");
  });

  it("calls onSubmit (local path) when requiresDeviceConfirm is false", async () => {
    const onSubmit = jest.fn();
    const onDeviceRename = jest.fn();
    const { user } = render(
      <EditContactDialog
        {...baseProps({
          onSubmit,
          requiresDeviceConfirm: false,
          onDeviceRename,
        })}
      />,
    );

    const input = screen.getByTestId("contacts-management-edit-contact-name");
    await user.clear(input);
    await user.type(input, "Alicia");
    await user.click(screen.getByTestId("contacts-management-edit-contact-submit"));

    expect(onSubmit).toHaveBeenCalledWith("Alicia");
    expect(onDeviceRename).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId("contacts-management-edit-contact-device-stub"),
    ).not.toBeInTheDocument();
  });

  it("switches to the device step when requiresDeviceConfirm is true", async () => {
    const onSubmit = jest.fn();
    const verb = jest.fn().mockResolvedValue(undefined);
    const onDeviceRename = jest.fn(() => verb);
    const { user } = render(
      <EditContactDialog
        {...baseProps({
          onSubmit,
          requiresDeviceConfirm: true,
          onDeviceRename,
        })}
      />,
    );

    const input = screen.getByTestId("contacts-management-edit-contact-name");
    await user.clear(input);
    await user.type(input, "Alicia");
    await user.click(screen.getByTestId("contacts-management-edit-contact-submit"));

    // The dialog must NOT take the local path — it hands the verb to
    // the runner instead.
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onDeviceRename).toHaveBeenCalledWith("Alicia");
    expect(
      screen.getByTestId("contacts-management-edit-contact-device-stub"),
    ).toBeInTheDocument();
    // Name input must be unmounted — the body has swapped to the runner.
    expect(
      screen.queryByTestId("contacts-management-edit-contact-name"),
    ).not.toBeInTheDocument();
  });

  it("re-primes the input when reopened with a different currentName", () => {
    const { rerender } = render(<EditContactDialog {...baseProps()} />);
    expect(
      (screen.getByTestId("contacts-management-edit-contact-name") as HTMLInputElement).value,
    ).toBe("Alice");

    rerender(<EditContactDialog {...baseProps({ open: false })} />);
    rerender(<EditContactDialog {...baseProps({ open: true, currentName: "Diana" })} />);

    expect(
      (screen.getByTestId("contacts-management-edit-contact-name") as HTMLInputElement).value,
    ).toBe("Diana");
  });

  describe("picture", () => {
    it("shows the placeholder when the contact has no picture", () => {
      render(<EditContactDialog {...baseProps()} />);

      expect(
        screen.getByTestId("contacts-management-contact-photo-placeholder"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("contacts-management-contact-photo-preview"),
      ).not.toBeInTheDocument();
    });

    it("pre-fills the preview with the contact's current picture", () => {
      render(
        <EditContactDialog {...baseProps({ currentPhoto: "data:image/png;base64,QUJD" })} />,
      );

      expect(screen.getByTestId("contacts-management-contact-photo-preview")).toHaveAttribute(
        "src",
        "data:image/png;base64,QUJD",
      );
    });

    it("enables Save on a photo-only change and commits it without renaming", async () => {
      const onSubmit = jest.fn();
      const onPhotoSave = jest.fn();
      const onOpenChange = jest.fn();
      const { user } = render(
        <EditContactDialog {...baseProps({ onSubmit, onPhotoSave, onOpenChange })} />,
      );

      // Untouched name → submit disabled until a picture lands.
      expect(screen.getByTestId("contacts-management-edit-contact-submit")).toBeDisabled();

      pickFile(pngFile());
      await screen.findByTestId("contacts-management-contact-photo-preview");
      expect(screen.getByTestId("contacts-management-edit-contact-submit")).toBeEnabled();

      await user.click(screen.getByTestId("contacts-management-edit-contact-submit"));

      expect(onPhotoSave).toHaveBeenCalledWith(expect.stringMatching(/^data:image\/png/));
      // Photo-only edit: no rename (local or device), dialog just closes.
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("deleting the current picture enables Save and commits `undefined`", async () => {
      const onPhotoSave = jest.fn();
      const onOpenChange = jest.fn();
      const { user } = render(
        <EditContactDialog
          {...baseProps({
            currentPhoto: "data:image/png;base64,QUJD",
            onPhotoSave,
            onOpenChange,
          })}
        />,
      );

      await user.click(screen.getByTestId("contacts-management-contact-photo-remove"));
      expect(screen.getByTestId("contacts-management-edit-contact-submit")).toBeEnabled();

      await user.click(screen.getByTestId("contacts-management-edit-contact-submit"));
      expect(onPhotoSave).toHaveBeenCalledWith(undefined);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("commits the photo change alongside a local rename", async () => {
      const onSubmit = jest.fn();
      const onPhotoSave = jest.fn();
      const { user } = render(<EditContactDialog {...baseProps({ onSubmit, onPhotoSave })} />);

      pickFile(pngFile());
      await screen.findByTestId("contacts-management-contact-photo-preview");
      const input = screen.getByTestId("contacts-management-edit-contact-name");
      await user.clear(input);
      await user.type(input, "Alicia");
      await user.click(screen.getByTestId("contacts-management-edit-contact-submit"));

      // Photo write first (under the current name — the rename re-keys
      // it), then the rename itself.
      expect(onPhotoSave).toHaveBeenCalledWith(expect.stringMatching(/^data:image\/png/));
      expect(onSubmit).toHaveBeenCalledWith("Alicia");
    });

    it("commits the photo before entering the device step on a device rename", async () => {
      const onPhotoSave = jest.fn();
      const verb = jest.fn().mockResolvedValue(undefined);
      const onDeviceRename = jest.fn(() => verb);
      const { user } = render(
        <EditContactDialog
          {...baseProps({ requiresDeviceConfirm: true, onDeviceRename, onPhotoSave })}
        />,
      );

      pickFile(pngFile());
      await screen.findByTestId("contacts-management-contact-photo-preview");
      const input = screen.getByTestId("contacts-management-edit-contact-name");
      await user.clear(input);
      await user.type(input, "Alicia");
      await user.click(screen.getByTestId("contacts-management-edit-contact-submit"));

      expect(onPhotoSave).toHaveBeenCalledWith(expect.stringMatching(/^data:image\/png/));
      expect(
        screen.getByTestId("contacts-management-edit-contact-device-stub"),
      ).toBeInTheDocument();
    });

    it("discards a staged picture when the dialog reopens", async () => {
      const { rerender } = render(<EditContactDialog {...baseProps()} />);

      pickFile(pngFile());
      await screen.findByTestId("contacts-management-contact-photo-preview");

      rerender(<EditContactDialog {...baseProps({ open: false })} />);
      rerender(<EditContactDialog {...baseProps({ open: true })} />);

      // Back to the contact's stored state (none) — the staged pick is gone.
      expect(
        screen.queryByTestId("contacts-management-contact-photo-preview"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("contacts-management-edit-contact-submit")).toBeDisabled();
    });
  });
});
