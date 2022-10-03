/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function ADD({ size, color }: Props): JSX.Element;
declare namespace ADD {
    var DefaultColor: string;
}
export default ADD;
