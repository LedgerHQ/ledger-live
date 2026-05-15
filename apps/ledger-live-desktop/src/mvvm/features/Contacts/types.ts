export type ContactsSubView = "overview" | "external" | "accounts" | "storage";

export type ContactsViewModel = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  subView: ContactsSubView;
  setSubView: (next: ContactsSubView) => void;
};

export type ContactsViewProps = ContactsViewModel;

/**
 * Wrapper passed to forms. Each form calls `run` with a verb that needs a
 * connected, app-open device. The dialog then renders `<RunDeviceAction>` on
 * top of the panel for as long as the verb is in flight, and resolves the
 * returned promise with `true` on success or `false` on user-driven back.
 */
export type RunVerb = (verb: (deviceId: string) => Promise<unknown>) => Promise<boolean>;

export type ContactsPanelViewProps = {
  subView: ContactsSubView;
  setSubView: (next: ContactsSubView) => void;
  run: RunVerb;
};
