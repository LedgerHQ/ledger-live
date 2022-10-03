/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ENG({ size, color }: Props): JSX.Element;
declare namespace ENG {
    var DefaultColor: string;
}
export default ENG;
