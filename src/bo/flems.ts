import {Static, Type} from '@sinclair/typebox';

const FileSchema = Type.Object({
	name: Type.String(),
	content: Type.String(),

	compiler: Type.Optional(Type.Any()),
	/*compiler: Type.Optional(Type.Union([
		Type.String(),
		Type.Function([Type.Any()], Type.Any()) // TODO better schema
	])),*/

	selections: Type.Optional(Type.String()),
	doc: Type.Optional(Type.Any())
})

const LinkSchema = Type.Object({
	name: Type.String(),
	type: Type.String(),
	url: Type.String()
})

const FlemOptionsSchema = Type.Object({
	files: Type.Array(FileSchema),
	links: Type.Array(LinkSchema),

	middle: Type.Optional(Type.Number()),
	selected: Type.Optional(Type.String()),
	color: Type.Optional(Type.String()),
	theme: Type.Optional(Type.Union([
		Type.Literal('material'),
		Type.Literal('none'),
		Type.Literal('default')
	])),

	resizeable: Type.Optional(Type.Boolean()),
	editable: Type.Optional(Type.Boolean()),
	toolbar: Type.Optional(Type.Boolean()),
	fileTabs: Type.Optional(Type.Boolean()),
	linkTabs: Type.Optional(Type.Boolean()),
	shareButton: Type.Optional(Type.Boolean()),
	reloadButton: Type.Optional(Type.Boolean()),
	console: Type.Optional(Type.Boolean()),
	autoReload: Type.Optional(Type.Boolean()),
	autoReloadDelay: Type.Optional(Type.Number()),
	autoHeight: Type.Optional(Type.Boolean())
});






export const EditorData = Type.Object({
	files: Type.Array(FileSchema),
	links: Type.Array(Type.String())
});
export type EditorData = Static<typeof EditorData>;

export type FlemInstance = {
	files: IFlemOptions['files']
	links: IFlemOptions['links']

	reload(): void
	focus(): void
	redraw(): void

	onchange(fn: (instance: FlemInstance) => void): void
	onload(fn: (instance: FlemInstance) => void): void
	onloaded(fn: (instance: FlemInstance) => void): void
}

export interface IFlemOptions {
	files: {
		name: string,
		content: string
		compiler?: string | Function
		selections?: string
		doc?: any
	}[],
	links: {
		name: string,
		type: string,
		url: string
	}[],

	middle?: number,
	selected?: string, // '.js',
	color?: string, // 'rgb(38,50,56)',
	theme?: 'material' | 'none' | 'default', // and 'none' or 'default'
	resizeable?: boolean,
	editable?: boolean,
	toolbar?: boolean,
	fileTabs?: boolean,
	linkTabs?: boolean,
	shareButton?: boolean,
	reloadButton?: boolean,
	console?: boolean,
	autoReload?: boolean,
	autoReloadDelay?: number,
	autoHeight?: boolean
}
