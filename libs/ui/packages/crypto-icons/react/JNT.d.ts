/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function JNT({ size, color }: Props): JSX.Element;
declare namespace JNT {
    var DefaultColor: string;
}
export default JNT;
