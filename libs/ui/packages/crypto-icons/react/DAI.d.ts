/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DAI({ size, color }: Props): JSX.Element;
declare namespace DAI {
    var DefaultColor: string;
}
export default DAI;
