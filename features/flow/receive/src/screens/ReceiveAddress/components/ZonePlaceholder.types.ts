/** A zone of the address screen, in screen order. Each zone's task replaces its placeholder. */
export type ReceiveAddressZone =
  | "header"
  | "summary"
  | "address"
  | "actions"
  | "notices"
  | "extras";

export type ZonePlaceholderProps = Readonly<{
  zone: ReceiveAddressZone;
}>;
