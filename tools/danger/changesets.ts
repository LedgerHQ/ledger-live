const CHANGESET_FILE = /^\.changeset\/[^/]+\.md$/;
const CHANGESET_README = ".changeset/README.md";
const FRONTMATTER_FENCE = /^---\s*$/m;
const PATCH_BUMP = /^["']?([^"':\s]+)["']?\s*:\s*patch\s*$/;

export type ChangesetFile = { path: string; content: string };
export type PatchBump = { path: string; packages: string[] };

export const isChangesetFile = (path: string): boolean =>
  CHANGESET_FILE.test(path) && path !== CHANGESET_README;

const frontmatterLines = (content: string): string[] => {
  const [, frontmatter = ""] = content.split(FRONTMATTER_FENCE);
  return frontmatter.split("\n").map(line => line.trim());
};

export const findPatchBumps = (files: ChangesetFile[]): PatchBump[] =>
  files
    .map(({ path, content }) => ({
      path,
      packages: frontmatterLines(content)
        .map(line => PATCH_BUMP.exec(line)?.[1])
        .filter((name): name is string => name !== undefined),
    }))
    .filter(bump => bump.packages.length > 0);
