/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BRD({ size, color }: Props): JSX.Element;
declare namespace BRD {
    var DefaultColor: string;
}
export default BRD;
