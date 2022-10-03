/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function EMC({ size, color }: Props): JSX.Element;
declare namespace EMC {
    var DefaultColor: string;
}
export default EMC;
