type AddContactViewModel = Readonly<{
  onAddNewContact?: () => void;
  onAddToExistingContact?: () => void;
}>;

export function useAddContactViewModel(): AddContactViewModel {
  return {
    onAddNewContact: undefined,
    onAddToExistingContact: undefined,
  };
}
