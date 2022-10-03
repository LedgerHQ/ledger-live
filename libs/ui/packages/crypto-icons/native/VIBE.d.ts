/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function VIBE({ size, color }: Props): JSX.Element;
declare namespace VIBE {
    var DefaultColor: string;
}
export default VIBE;
