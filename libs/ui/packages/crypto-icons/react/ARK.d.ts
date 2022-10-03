/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ARK({ size, color }: Props): JSX.Element;
declare namespace ARK {
    var DefaultColor: string;
}
export default ARK;
