import { CosmosMessage } from "./types";

export const getMainMessage = (messages: CosmosMessage[]): CosmosMessage => {
  const messagePriorities: string[] = [
    "unbond",
    "redelegate",
    "delegate",
    "withdraw_rewards",
    "transfer",
  ];
  const sortedTypes = messages
    .filter(m => messagePriorities.includes(m.type))
    .sort((a, b) => messagePriorities.indexOf(a.type) - messagePriorities.indexOf(b.type));
  return sortedTypes[0];
};

const order = unordered =>
  Object.keys(unordered)
    .sort()
    .reduce((obj, key) => {
      obj[key] = unordered[key];
      return obj;
    }, {});

export const sortObjectKeysDeeply = object => {
  for (let [key, value] of Object.entries(object)) {
    if (Array.isArray(value)) {
      const newArray = new Array();
      for (const element of value) {
        newArray.push(sortObjectKeysDeeply(element));
      }
      object[key] = newArray;
    } else if (typeof value === "object") {
      object[key] = sortObjectKeysDeeply(value);
    }
  }
  return order(object);
};
