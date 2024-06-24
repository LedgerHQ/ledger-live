import fs from "fs";
import path from "path";
import type { DistantState, LocalState } from "..";

type Module<LocalS, DistantS> = {
  emptyState: LocalS;
  genState: (index: number) => LocalS;
  convertLocalToDistantState: (localState: LocalS) => DistantS;
  convertDistantToLocalState: (distantState: DistantS) => LocalS;
};
type Modules = {
  [key in ModuleKey]: Module<LocalState[key], DistantState[key]>;
};

type ModuleKey = keyof LocalState;

// import all mock modules/*
const modules: Modules = {} as Modules;
fs.readdirSync(path.join(__dirname, "modules")).map(file => {
  if (file.endsWith(".ts")) {
    const slug = file.replace(".ts", "") as ModuleKey;
    modules[slug] = require(`./modules/${file}`);
  }
});

export const emptyState: LocalState = Object.fromEntries(
  Object.entries(modules).map(([slug, module]) => [slug, module.emptyState]),
) as LocalState;

export const genState = (index: number): LocalState =>
  Object.fromEntries(
    Object.entries(modules).map(([slug, module]) => [slug, module.genState(index)]),
  ) as LocalState;

export const genModuleState = <K extends ModuleKey>(name: K, index: number): LocalState[K] => {
  const mod = modules[name];
  if (!mod) throw new Error(`module ${name} not found`);
  return mod.genState(index);
};

export const convertLocalToDistantState = (localState: LocalState): DistantState =>
  Object.fromEntries(
    Object.entries(modules).map(([slug, module]) => [
      slug,
      module.convertLocalToDistantState(
        // @ts-expect-error can't seem to prove that slug is valid here
        localState[slug],
      ),
    ]),
  ) as DistantState;

export const convertDistantToLocalState = (distantState: DistantState): LocalState =>
  Object.fromEntries(
    Object.entries(modules).map(([slug, module]) => [
      slug,
      module.convertDistantToLocalState(
        // @ts-expect-error can't seem to prove that slug is valid here
        distantState[slug],
      ),
    ]),
  ) as LocalState;

export const similarLocalState = (a: LocalState, b: LocalState): boolean =>
  Object.entries(modules).every(([slug, module]) =>
    // @ts-expect-error can't seem to prove that slug is valid here
    module.similarLocalState(a[slug], b[slug]),
  );
