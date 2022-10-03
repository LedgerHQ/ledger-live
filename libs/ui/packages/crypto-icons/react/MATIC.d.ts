/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MATIC({ size, color }: Props): JSX.Element;
declare namespace MATIC {
    var DefaultColor: string;
}
export default MATIC;
