/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function HT({ size, color }: Props): JSX.Element;
declare namespace HT {
    var DefaultColor: string;
}
export default HT;
