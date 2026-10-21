import dadaHandlers from "./dada/handler";
import statusHandlers from "./status/handler";
import cmcHandlers from "./cmc/handler";
import cardHandlers from "./card/handler";
import calHandlers from "./cal/handler";

const handlers = [
  ...dadaHandlers,
  ...statusHandlers,
  ...cmcHandlers,
  ...cardHandlers,
  ...calHandlers,
];

export default handlers;
