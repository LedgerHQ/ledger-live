/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DLT({ size, color }: Props): JSX.Element;
declare namespace DLT {
    var DefaultColor: string;
}
export default DLT;
