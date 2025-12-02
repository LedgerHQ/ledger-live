/// <reference types="react" />
type Props = {
    size?: number | string;
    color?: string;
};
declare function SGB({ size, color }: Props): JSX.Element;
declare namespace SGB {
    var DefaultColor: string;
}
export default SGB;
