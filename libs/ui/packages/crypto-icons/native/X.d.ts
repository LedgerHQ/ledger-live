/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function X({ size, color }: Props): JSX.Element;
declare namespace X {
    var DefaultColor: string;
}
export default X;
