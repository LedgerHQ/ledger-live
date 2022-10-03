/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DGB({ size, color }: Props): JSX.Element;
declare namespace DGB {
    var DefaultColor: string;
}
export default DGB;
