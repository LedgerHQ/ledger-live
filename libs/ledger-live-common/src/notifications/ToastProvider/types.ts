export type ToastData = {
  id: string;
  title: string;
  text?: string;
  type: string;
  icon: string;
  callback?: () => void;
};
