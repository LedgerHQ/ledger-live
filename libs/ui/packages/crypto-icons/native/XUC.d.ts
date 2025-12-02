/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function XUC({ size, color }: Props): JSX.Element;
declare namespace XUC {
    var DefaultColor: string;
}
export default XUC;
