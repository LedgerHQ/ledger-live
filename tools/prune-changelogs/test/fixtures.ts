export const HEADER = "# @ledgerhq/example";

export function section(version: string, body = `- abc1234: change for ${version}`): string {
  return `## ${version}\n\n### Patch Changes\n\n${body}\n`;
}

/** Builds a file in exactly the shape `@changesets/apply-release-plan` writes. */
export function changelog(versions: string[]): string {
  return [`${HEADER}\n`, ...versions.map(version => section(version))].join("\n");
}

export function versions(count: number, minor = 0): string[] {
  return Array.from({ length: count }, (_, index) => `1.${minor}.${count - index - 1}`);
}
