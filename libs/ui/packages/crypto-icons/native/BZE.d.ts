/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BZE({ size, color }: Props): JSX.Element;
declare namespace BZE {
    var DefaultColor: string;
}
export default BZE;
