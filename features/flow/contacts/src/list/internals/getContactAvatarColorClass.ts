const ContactAvatarColorClasses = [
  "bg-accent text-on-accent",
  "bg-active-subtle text-active",
  "bg-interactive text-on-interactive",
  "bg-success-transparent text-success",
  "bg-warning-transparent text-warning",
] as const;

export function getContactAvatarColorClass(contactId: string): string {
  let hash = 0;

  for (const char of contactId) {
    hash = (hash + char.charCodeAt(0)) % ContactAvatarColorClasses.length;
  }

  return ContactAvatarColorClasses[hash] ?? ContactAvatarColorClasses[0];
}
