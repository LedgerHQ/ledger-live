/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function STORM({ size, color }: Props): JSX.Element;
declare namespace STORM {
    var DefaultColor: string;
}
export default STORM;
