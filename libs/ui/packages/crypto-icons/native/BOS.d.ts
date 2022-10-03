/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BOS({ size, color }: Props): JSX.Element;
declare namespace BOS {
    var DefaultColor: string;
}
export default BOS;
