/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function PART({ size, color }: Props): JSX.Element;
declare namespace PART {
    var DefaultColor: string;
}
export default PART;
