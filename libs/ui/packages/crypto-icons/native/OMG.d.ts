/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function OMG({ size, color }: Props): JSX.Element;
declare namespace OMG {
    var DefaultColor: string;
}
export default OMG;
