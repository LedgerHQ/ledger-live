export type ReleaseNote = {
  // eslint-disable-next-line camelcase
  tag_name: string;
  body: string;
};

export type ReleaseNotesViewProps = {
  isOpen: boolean;
  notes: ReleaseNote[];
  onClose: () => void;
  onGotIt: () => void;
};
