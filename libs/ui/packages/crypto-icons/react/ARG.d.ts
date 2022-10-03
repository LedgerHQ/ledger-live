/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ARG({ size, color }: Props): JSX.Element;
declare namespace ARG {
    var DefaultColor: string;
}
export default ARG;
