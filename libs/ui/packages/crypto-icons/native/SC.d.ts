/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function SC({ size, color }: Props): JSX.Element;
declare namespace SC {
    var DefaultColor: string;
}
export default SC;
