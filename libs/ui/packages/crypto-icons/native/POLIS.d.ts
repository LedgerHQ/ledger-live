/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function POLIS({ size, color }: Props): JSX.Element;
declare namespace POLIS {
    var DefaultColor: string;
}
export default POLIS;
