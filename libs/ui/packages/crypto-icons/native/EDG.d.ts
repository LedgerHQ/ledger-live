/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function EDG({ size, color }: Props): JSX.Element;
declare namespace EDG {
    var DefaultColor: string;
}
export default EDG;
