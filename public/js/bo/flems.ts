export interface IEditorData {
	files: IFlemOptions['files'];
	links: string[];
}

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
