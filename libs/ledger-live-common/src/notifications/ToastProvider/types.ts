export type ToastData = {
  id: string;
  title: string;
  text?: string | null;
  type?: string;
  icon?: string;
  callback?: () => void;
};
