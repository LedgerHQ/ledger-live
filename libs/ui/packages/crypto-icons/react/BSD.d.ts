/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function BSD({ size, color }: Props): JSX.Element;
declare namespace BSD {
    var DefaultColor: string;
}
export default BSD;
