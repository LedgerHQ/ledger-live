/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function INK({ size, color }: Props): JSX.Element;
declare namespace INK {
    var DefaultColor: string;
}
export default INK;
