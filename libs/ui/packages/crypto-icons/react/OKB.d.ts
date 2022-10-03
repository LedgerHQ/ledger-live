/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function OKB({ size, color }: Props): JSX.Element;
declare namespace OKB {
    var DefaultColor: string;
}
export default OKB;
