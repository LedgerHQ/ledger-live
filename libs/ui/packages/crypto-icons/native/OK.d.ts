/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function OK({ size, color }: Props): JSX.Element;
declare namespace OK {
    var DefaultColor: string;
}
export default OK;
