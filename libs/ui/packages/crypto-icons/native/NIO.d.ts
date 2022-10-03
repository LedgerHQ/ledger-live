/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NIO({ size, color }: Props): JSX.Element;
declare namespace NIO {
    var DefaultColor: string;
}
export default NIO;
