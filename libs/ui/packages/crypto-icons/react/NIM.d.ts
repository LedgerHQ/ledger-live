/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NIM({ size, color }: Props): JSX.Element;
declare namespace NIM {
    var DefaultColor: string;
}
export default NIM;
