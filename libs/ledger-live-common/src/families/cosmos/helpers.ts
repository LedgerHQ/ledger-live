type Message = {
  type: string;
  attributes: { [key: string]: any };
};

export const getMainMessage = (messages: Message[]): Message => {
  const messagePriorities: string[] = [
    "unbond",
    "redelegate",
    "delegate",
    "withdraw_rewards",
    "transfer",
  ];
  const sortedTypes = messages
    .filter((m) => messagePriorities.includes(m.type))
    .sort(
      (a, b) =>
        messagePriorities.indexOf(a.type) - messagePriorities.indexOf(b.type)
    );
  return sortedTypes[0];
};
