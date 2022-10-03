/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BNT({ size, color }: Props): JSX.Element;
declare namespace BNT {
    var DefaultColor: string;
}
export default BNT;
