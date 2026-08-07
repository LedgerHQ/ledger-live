const ContactInitialPattern = /^\p{L}[\p{Mn}\p{Mc}]*/u;

export function getContactInitial(name: string): string {
  const initial = ContactInitialPattern.exec(name)?.[0];

  return initial?.toUpperCase() ?? "";
}
