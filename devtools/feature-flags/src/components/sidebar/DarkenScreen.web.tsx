export interface DarkenScreenProps {
  readonly onClick?: () => void;
}

export function DarkenScreen({ onClick }: DarkenScreenProps) {
  return <div aria-hidden="true" className="fixed inset-0 bg-black/50 z-50" onClick={onClick} />;
}
