import type { Tree } from "@nx/devkit";
import type { devtoolGeneratorSchema } from "./schema";

export default async function (_tree: Tree, _options: devtoolGeneratorSchema) {
  throw new Error("Generator not yet available");
}

export async function reformatGenerator(_tree: Tree) {
  throw new Error("Generator not yet available.");
}
