const NameInitialPattern = /^\p{L}[\p{Mn}\p{Mc}]*/u;

export function getNameInitial(name: string): string {
  const initial = NameInitialPattern.exec(name)?.[0];

  return initial?.toUpperCase() ?? "";
}
