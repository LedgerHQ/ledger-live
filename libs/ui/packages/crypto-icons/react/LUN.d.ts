/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function LUN({ size, color }: Props): JSX.Element;
declare namespace LUN {
    var DefaultColor: string;
}
export default LUN;
