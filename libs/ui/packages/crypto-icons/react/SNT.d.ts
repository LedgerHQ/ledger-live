/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SNT({ size, color }: Props): JSX.Element;
declare namespace SNT {
    var DefaultColor: string;
}
export default SNT;
