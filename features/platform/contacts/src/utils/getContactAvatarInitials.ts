import { getContactInitial } from "./getContactInitial";

export function getContactAvatarInitials(name: string): string {
  return (name.match(/\p{L}[\p{L}\p{Mn}\p{Mc}]*/gu) ?? [])
    .slice(0, 2)
    .map(getContactInitial)
    .join("");
}
