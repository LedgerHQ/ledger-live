import { MakeModalsType } from "~/renderer/modals/types";

export type ModalsData = Record<string, never>;

const modals: MakeModalsType<ModalsData> = {};

export default modals;
