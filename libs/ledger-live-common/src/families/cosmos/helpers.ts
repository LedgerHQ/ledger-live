type Message = {
  type: string;
  attributes: { [key: string]: any };
};

export const getMainMessage = (messages: Message[]): Message => {
  const messagePriorities: string[] = [
    "withdraw_rewards",
    "unbond",
    "redelegate",
    "delegate",
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
