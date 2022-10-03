/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ABT({ size, color }: Props): JSX.Element;
declare namespace ABT {
    var DefaultColor: string;
}
export default ABT;
