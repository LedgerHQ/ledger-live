/** What the tag of a pending row says the next session runs on. */
export const nextLabel = ({
  currentChoice,
  selectedChoice,
}: Readonly<{ currentChoice: string; selectedChoice: string }>) =>
  selectedChoice === currentChoice ? "Next: new values" : `Next: ${selectedChoice}`;
