/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BPT({ size, color }: Props): JSX.Element;
declare namespace BPT {
    var DefaultColor: string;
}
export default BPT;
