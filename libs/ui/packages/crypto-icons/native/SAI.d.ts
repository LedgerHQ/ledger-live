/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SAI({ size, color }: Props): JSX.Element;
declare namespace SAI {
    var DefaultColor: string;
}
export default SAI;
