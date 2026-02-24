import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
} from "@ledgerhq/lumen-ui-react";
import Markdown from "~/renderer/components/Markdown";
import { cn } from "LLD/utils/cn";
import type { ReleaseNotesViewProps } from "./types";
import releaseNoteImage from "./assets/release-note.webp";

// Tailwind styles for markdown to keep compatibility with the old design system
const markdownStyles = cn(
  "body-2 text-base",
  "[&_a]:cursor-pointer [&_a]:text-interactive [&_a]:underline",
  "[&_ol]:list-decimal [&_ol]:pl-20 [&_ul]:list-disc [&_ul]:pl-20",
  "[&_li]:my-4",
  "[&_p]:my-8",
  "[&_h1]:heading-5-semi-bold [&_h2]:heading-5-semi-bold [&_h3]:heading-5-semi-bold",
  "[&_h1]:mt-16 [&_h2]:mt-16 [&_h3]:mt-16",
  "[&_h1]:mb-8 [&_h2]:mb-8 [&_h3]:mb-8",
  "[&_strong]:font-[600]",
  "[&_hr]:my-12 [&_hr]:border-muted",
);

const ReleaseNotesDialogView = ({ isOpen, notes, onClose, onGotIt }: ReleaseNotesViewProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh]" aria-describedby={undefined}>
        <DialogHeader appearance="compact" title={t("releaseNotes.title")} onClose={onClose} />
        <DialogBody className="min-h-0 flex-1 gap-24 overflow-y-auto px-24">
          {releaseNoteImage ? (
            <img
              src={releaseNoteImage}
              alt="release note image"
              className="h-[200px] w-full rounded-lg object-cover"
            />
          ) : null}
          <div className="flex flex-col gap-24">
            {notes.map(note => (
              <div key={note.tag_name} className="flex flex-col gap-8">
                <h3 className="heading-5-semi-bold text-base">
                  {t("releaseNotes.version", { versionNb: note.tag_name })}
                </h3>
                <div className={markdownStyles}>
                  <Markdown>{note.body}</Markdown>
                </div>
              </div>
            ))}
          </div>
        </DialogBody>
        <DialogFooter className="justify-center">
          <Button appearance="base" isFull onClick={onGotIt} data-testid="release-notes-got-it">
            {t("releaseNotes.gotIt")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseNotesDialogView;
