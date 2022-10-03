/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ENJ({ size, color }: Props): JSX.Element;
declare namespace ENJ {
    var DefaultColor: string;
}
export default ENJ;
