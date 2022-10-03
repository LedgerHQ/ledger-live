/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function CDT({ size, color }: Props): JSX.Element;
declare namespace CDT {
    var DefaultColor: string;
}
export default CDT;
