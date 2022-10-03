/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function HUC({ size, color }: Props): JSX.Element;
declare namespace HUC {
    var DefaultColor: string;
}
export default HUC;
