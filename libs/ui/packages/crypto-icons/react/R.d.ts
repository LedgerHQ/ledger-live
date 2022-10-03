/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function R({ size, color }: Props): JSX.Element;
declare namespace R {
    var DefaultColor: string;
}
export default R;
