import dadaHandlers from "./dada/handler";
import statusHandlers from "./status/handler";
import cmcHandlers from "./cmc/handler";

const handlers = [...dadaHandlers, ...statusHandlers, ...cmcHandlers];

export default handlers;
