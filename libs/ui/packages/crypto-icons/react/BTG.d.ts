/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BTG({ size, color }: Props): JSX.Element;
declare namespace BTG {
    var DefaultColor: string;
}
export default BTG;
