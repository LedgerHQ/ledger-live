/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function HOT({ size, color }: Props): JSX.Element;
declare namespace HOT {
    var DefaultColor: string;
}
export default HOT;
