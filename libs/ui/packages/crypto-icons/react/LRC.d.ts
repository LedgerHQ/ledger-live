/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function LRC({ size, color }: Props): JSX.Element;
declare namespace LRC {
    var DefaultColor: string;
}
export default LRC;
