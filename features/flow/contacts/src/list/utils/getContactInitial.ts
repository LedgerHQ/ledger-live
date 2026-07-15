const ContactInitialPattern = /^\p{L}[\p{Mn}\p{Mc}]*/u;

export function getContactInitial(name: string): string {
  const initial = name.match(ContactInitialPattern)?.[0];

  return initial?.toUpperCase() ?? "";
}
