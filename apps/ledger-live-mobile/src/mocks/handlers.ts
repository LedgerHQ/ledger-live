import dadaHandlers from "./dada/handler";
import statusHandlers from "./status/handler";

const handlers = [...dadaHandlers, ...statusHandlers];

export default handlers;
