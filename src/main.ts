import { Editor, MarkdownFileInfo, MarkdownView, Plugin } from 'obsidian';

export default class RepetitiveTasksPlugin extends Plugin {
	lastTriggered = 0;

	async onload() {
		this.registerEvent(
			this.app.workspace.on('editor-change', (editor: Editor, info: MarkdownView | MarkdownFileInfo) => {
				// Prevent multiple triggers due to change of editor inside this function
				if(this.lastTriggered + 100 > Date.now()) {
					return;
				}
				this.lastTriggered = Date.now();

				// Get the content of the editor before and after the change
				const contentAfterChange = editor.getValue();
				//@ts-ignore
				const contentBeforeChange  = info.data;
				
				// Split the content into lines
				const contentBeforeChangeLines = contentBeforeChange.split('\n');
				const contentAfterChangeLines = contentAfterChange.split('\n');

				// Find the first line that changed
				let lineIndex = 0;
				for (;lineIndex < contentBeforeChangeLines.length; lineIndex++) {
					if(contentBeforeChangeLines[lineIndex]	!== contentAfterChangeLines[lineIndex]) {
						break;
					}
				}

				//No change detected
				if(lineIndex === contentBeforeChangeLines.length) {
					return;
				}

				// Get the the todo from the line
				const todoRegexOld = /^([^\S\r\n]*)- \[(.)] (.*#(\d).*)$/gm
				const todoRegexNew = /^([^\S\r\n]*)- \[(.)] (.*#(\d).*)$/gm

				const todoMatchOld = todoRegexOld.exec(contentBeforeChangeLines[lineIndex]);
				const todoMatchNew = todoRegexNew.exec(contentAfterChangeLines[lineIndex]);

				// No todo with repeat detected
				if(!todoMatchOld || !todoMatchNew) {
					return;
				}

				const oldTodo = {
					indent: todoMatchOld[1],
					state: todoMatchOld[2],
					text: todoMatchOld[3],
					count: -1,
					repeat: parseInt(todoMatchOld[4]),
				}

				const newTodo = {
					indent: todoMatchNew[1],
					state: todoMatchNew[2],
					text: todoMatchNew[3],
					count: -1,
					repeat: parseInt(todoMatchOld[4]),
				}

				// No change in todo state detected
				if(oldTodo.state === newTodo.state) {
					return;
				}

				if (oldTodo.state === ' ') {
					newTodo.count = 0;
				} else {
					const count = Number(oldTodo.state)
					if(isNaN(count)) {
						return;
					}
					newTodo.count = count;
				}

				// Increment Count and check if todo is done
				newTodo.count++;
				if(newTodo.count >= newTodo.repeat) {
					newTodo.state = 'x'
				} else {
					newTodo.state = (newTodo.count).toString();
				}

				editor.setLine(lineIndex, `${newTodo.indent}- [${newTodo.state}] ${newTodo.text}`);
			})
		  );

	}

	onunload() {}
}
