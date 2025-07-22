import {IEditorData, IFlemOptions, FlemInstance, IFlemOptions_file} from "./bo/flems.js";



declare var Flems : (target:HTMLElement, opts: IFlemOptions, runtimeUrl?:string) => FlemInstance;
let flemInstance : FlemInstance|null = null;



let editorData: IEditorData;

const defaultEditors: IEditorData = {
	files: [
		{
			name: 'app.html',
			content: '<h3>No need to write &lt;body&gt; &lt;/body&gt;</h3>'
		},
		{
			name: 'app.css',
			content: 'body {\n\tpadding: 0;\n}\nbody.red {\n\tbackground: rgba(200,0,0,0.2);\n}'
		},
		{
			name: 'app.js',
			content: 'console.dir(location.href);'
		},
	],
	links: [],
}

function optsToFlemState(data: IEditorData): IFlemOptions {
	return {
		theme: 'material',

		fileTabs: true,
		linkTabs: true,
		reloadButton: true,
		console: true,
		shareButton: false,

		files: data.files,
		selected: data.files.find(file => {
			return file.name.endsWith('.js')
		})?.name,
		links: (data.links ?? [])
			.map(lib => {
				return {
					name: lib,
					type: 'script',
					url: 'https://unpkg.com/' + lib
				}
			})
	};
}

async function init(data: IEditorData=defaultEditors) {
	const search = new URLSearchParams(window.location.search),
		id = search.get('id');
	if (id !== null) {
		const idData = await (await fetch(`/data/${id}.json`)).json();
		if (idData && typeof idData === 'object') {
			data = editorData = {
				files: Array.isArray(idData.files) ? idData.files : defaultEditors.files,
				links: Array.isArray(idData.links) ? idData.links : defaultEditors.links,
				selected: idData.selected,
			};
			editorData.files = editorData.files ?? defaultEditors.files;
			editorData.links = editorData.links ?? defaultEditors.links;
		} else {
			throw new Error(`Could not find valid data from ${JSON.stringify(id)}`);
		}
	}
	if (!editorData) {
		editorData = {
			files: data.files,
			links: data.links,
			selected: data.selected,
		};
	}

	console.info('init');
	flemInstance = Flems(document.body, optsToFlemState(data), '/flems/runtime.html');

	flemInstance.onchange(function (instance) {
		editorData = {
			files: instance.files,
			links: instance.links.map(lib => lib.name),
		};
	});
}


init()
	.catch(console.error);



function removeFile(fileName: string) {
	// noinspection SuspiciousTypeOfGuard
	if (typeof fileName !== 'string' || !fileName) {
		throw new Error('fileName must be a string');
	}
	if (!flemInstance) {
		throw new Error('flemInstance not found');
	}

	const fileIndex = editorData.files.findIndex(file => file.name === fileName);
	if (fileIndex === -1) throw new Error('fileName not found');
	editorData.files.splice(fileIndex, 1);
	flemInstance.set(optsToFlemState(editorData));
}
function addFile(file: IFlemOptions_file) {
	// noinspection SuspiciousTypeOfGuard
	if (typeof file !== 'object' || !file) {
		throw new Error('Invalid file');
	}
	if (!flemInstance) {
		throw new Error('flemInstance not found');
	}

	// noinspection SuspiciousTypeOfGuard
	if (typeof file.name !== 'string') {
		throw new Error('File name must be a string');
	}
	// noinspection SuspiciousTypeOfGuard
	if (file.type !== undefined && typeof file.type !== 'string') {
		throw new Error('File type must be a string');
	}
	// noinspection SuspiciousTypeOfGuard
	if (typeof file.content !== 'string') {
		throw new Error('File content must be a string');
	}
	// noinspection SuspiciousTypeOfGuard
	if (file.selections !== undefined && typeof file.selections !== 'string') {
		throw new Error('File selections must be a string');
	}
	// noinspection SuspiciousTypeOfGuard
	if (typeof file.compiler !== 'string' && typeof file.compiler !== 'function') {
		throw new Error('File compiler must be a string or a function');
	}
	editorData.files.push({
		name: file.name,
		type: file.type,
		content: file.content,
		selections: file.selections,
		doc: file.doc,
		compiler: file.compiler ? file.compiler : undefined,
	});
	flemInstance.set(optsToFlemState(editorData));
}
function addLib(libName:string) {
	// noinspection SuspiciousTypeOfGuard
	if (typeof libName !== 'string' || !libName) {
		throw new Error('libName must be a string');
	}
	if (!flemInstance) {
		throw new Error('flemInstance not found');
	}

	editorData.links.push(libName);
	flemInstance.set(optsToFlemState(editorData));
}
function removeLib(libName:string) {
	// noinspection SuspiciousTypeOfGuard
	if (typeof libName !== 'string' || !libName) {
		throw new Error('libName must be a string');
	}
	if (!flemInstance) {
		throw new Error('flemInstance not found');
	}

	const libIndex = editorData.links.indexOf(libName);
	if (libIndex === -1) throw new Error('libName not found');
	editorData.links.splice(libIndex, 1);
	flemInstance.set(optsToFlemState(editorData));
}
// noinspection JSUnusedGlobalSymbols
const zPlayground = {
	addFile,
	removeFile,
	addLib,
	removeLib,
};
// @ts-ignore
self.zPlayground = zPlayground;



document.addEventListener('keydown', function(event) {
	// Check if Ctrl (or Cmd on Mac) key is pressed and S key is pressed
	if ((event.ctrlKey || event.metaKey) && event.key === 's') {
		// Prevent the default save action
		event.preventDefault();

		saveDocument()
			.catch(console.error);
	}
});

async function saveDocument() {
	const search = new URLSearchParams(window.location.search),
		id = search.get('id'),
		params = new URLSearchParams();

	if (id !== null) {
		params.append('id', id);
	}

	const data = {
		files: editorData.files.map(file => {
			return {
				name: file.name,
				content: file.content,
				selections: file.selections,
			}
		}),
		links: editorData.links,
	};
	const result = await (await fetch(`/save?${params.toString()}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	})).json();

	if (result.error) {
		throw new Error(result.error);
	}

	const resultId = result.data.id;
	if (!resultId || typeof resultId !== 'string') {
		throw new Error(`${resultId} is not a valid id`);
	}


	const url = new URL(location.href);
	if (url.searchParams.get('id') === null || !url.searchParams.get('id')) {
		url.searchParams.set('id', resultId);
		history.pushState({ id: id }, '', `${window.location.pathname}?${url.searchParams.toString()}`);
	}
}
