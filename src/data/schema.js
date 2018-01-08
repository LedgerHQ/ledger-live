//@flow
import { create } from "../restlay/SchemaDef";

// The schema defines how entities connect to each other in the API model

const Currency = create("currencies", {}, "name");

export default {
  Currency
};
