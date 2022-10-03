/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function NEBL({ size, color }: Props): JSX.Element;
declare namespace NEBL {
    var DefaultColor: string;
}
export default NEBL;
