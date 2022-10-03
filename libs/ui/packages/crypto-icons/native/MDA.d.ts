/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function MDA({ size, color }: Props): JSX.Element;
declare namespace MDA {
    var DefaultColor: string;
}
export default MDA;
