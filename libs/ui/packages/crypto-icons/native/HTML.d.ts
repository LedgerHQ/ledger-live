/// <reference types="react" />
declare type Props = {
    size?: number | string;
    color?: string;
};
declare function HTML({ size, color }: Props): JSX.Element;
declare namespace HTML {
    var DefaultColor: string;
}
export default HTML;
