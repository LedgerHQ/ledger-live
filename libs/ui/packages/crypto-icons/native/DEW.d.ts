/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function DEW({ size, color }: Props): JSX.Element;
declare namespace DEW {
    var DefaultColor: string;
}
export default DEW;
