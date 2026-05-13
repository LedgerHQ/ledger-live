export type ContactsSubView = "actions" | "storage";

export type ContactsViewModel = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  setSessionId: (sessionId: string | null) => void;
  subView: ContactsSubView;
  setSubView: (next: ContactsSubView) => void;
};

export type ContactsViewProps = ContactsViewModel;

export type ContactsPanelViewProps = {
  sessionId: string | null;
  setSessionId: (sessionId: string | null) => void;
  subView: ContactsSubView;
  setSubView: (next: ContactsSubView) => void;
};
