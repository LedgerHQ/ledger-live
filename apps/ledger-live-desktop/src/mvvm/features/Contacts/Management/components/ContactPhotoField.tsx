import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, IconButton } from "@ledgerhq/lumen-ui-react";
import { Trash, User } from "@ledgerhq/lumen-ui-react/symbols";

/**
 * Accepted upload formats for the contact picture. Checked against the
 * file's MIME type — `image/jpeg` covers both .jpg and .jpeg.
 */
const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png"];
/** Mirrors the `accept` attribute on the hidden file input. */
const PHOTO_INPUT_ACCEPT = ".jpg,.jpeg,.png,image/jpeg,image/png";
/** 2MB cap from the Figma spec ("Max size: 2MB"). */
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

type Props = {
  /** The accepted picture as a `data:` URL; `undefined` = none. */
  photo: string | undefined;
  /**
   * Fired when the user picks a valid file (with its data URL) or
   * clears the picture (`undefined`). Rejected files never fire this —
   * they only surface the inline error.
   */
  onPhotoChange: (photo: string | undefined) => void;
};

/**
 * Contact-picture picker row shared by the Add-contact and Edit-contact
 * dialogs (Figma 14369:13296):
 *   - 56px circular slot: a gray placeholder with the `User` glyph
 *     until a picture is chosen, then a cropped preview of the upload.
 *   - "Upload picture" button opening the OS file picker (hidden
 *     `<input type="file">`). Re-clicking it with a picture already
 *     selected simply replaces it.
 *   - A trash `IconButton` (only once a picture is selected) clears it.
 *   - Caption under the button: accepted formats + max size, swapped
 *     for a red error line when the chosen file is rejected
 *     (non-JPG/PNG or >2MB). A rejected file never clobbers a
 *     previously accepted picture.
 *
 * The rejection state is local — re-mount (via `key`) to reset it when
 * the host dialog reopens.
 */
export function ContactPhotoField({ photo, onPhotoChange }: Props) {
  const { t } = useTranslation();
  const [photoError, setPhotoError] = useState<"format" | "size" | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Clear the native input so picking the same file again still fires
    // a `change` event (the browser dedupes identical selections).
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError("format");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("size");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      // `readAsDataURL` always produces a string result.
      if (typeof reader.result === "string") {
        onPhotoChange(reader.result);
        setPhotoError(undefined);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-16 w-full">
      {photo === undefined ? (
        // Placeholder: gray disc with the Lumen `User` glyph, standing
        // in for the picture until one is chosen.
        <div
          data-testid="contacts-management-contact-photo-placeholder"
          className="shrink-0 size-56 rounded-full bg-muted flex items-center justify-center"
        >
          <User size={24} className="text-muted" />
        </div>
      ) : (
        // Cropped circular preview of the accepted upload.
        <img
          src={photo}
          alt={t("contactsManagement.addContactDialog.photoPreviewAlt")}
          data-testid="contacts-management-contact-photo-preview"
          className="shrink-0 size-56 rounded-full object-cover"
        />
      )}
      <div className="flex flex-col gap-8 min-w-0">
        <div className="flex items-center gap-8">
          <Button
            appearance="base"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            data-testid="contacts-management-contact-photo-upload"
          >
            {t("contactsManagement.addContactDialog.uploadPicture")}
          </Button>
          {photo !== undefined && (
            <IconButton
              appearance="gray"
              size="sm"
              icon={Trash}
              onClick={() => {
                onPhotoChange(undefined);
                setPhotoError(undefined);
              }}
              aria-label={t("contactsManagement.addContactDialog.removePicture")}
              data-testid="contacts-management-contact-photo-remove"
            />
          )}
        </div>
        {/* Format/size caption, swapped for the rejection reason in
            `text-error` when the last pick was refused. */}
        <p
          className={photoError ? "body-3 text-error" : "body-3 text-muted"}
          data-testid="contacts-management-contact-photo-hint"
        >
          {photoError === "format"
            ? t("contactsManagement.addContactDialog.errorPhotoFormat")
            : photoError === "size"
              ? t("contactsManagement.addContactDialog.errorPhotoSize")
              : t("contactsManagement.addContactDialog.photoHint")}
        </p>
      </div>
      {/* Hidden OS picker — triggered by the button(s) above. */}
      <input
        ref={fileInputRef}
        type="file"
        accept={PHOTO_INPUT_ACCEPT}
        onChange={handlePhotoChange}
        className="hidden"
        data-testid="contacts-management-contact-photo-input"
      />
    </div>
  );
}
