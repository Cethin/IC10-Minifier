// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import crc32 from 'crc32-ts';

const DEFINE_STRING:string = "define ";
const ALIAS_STRING:string = "alias ";
const LINE_LENGTH:number = 52;
const FILE_PREFIX:string = "minified_";
const HASH_STRING:string = "HASH(";
const IGNORE:Array<string> = [" ", "\t", "."];
const TERMINATE:Array<string> = ["\n"];

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('IC10Minifier.minify', async() => {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;
		
		if (editor) {
            // Get the URI of the current file
            const uri = editor.document.uri;
            
            try {
                // Read the contents of the file
                const content = await vscode.workspace.fs.readFile(uri);
                
                // Modify the string to replace defines and aliases
                let str = Buffer.from(content).toString();
				str = removeComments(str);
				str = replace(str, DEFINE_STRING);
				str = replace(str, ALIAS_STRING);
				let lines:Array<string> = toLines(str);
				lines = removeBlankLines(lines);
				str = replaceLabels(lines);

				// Save to new file
				let fileName = path.basename(uri.fsPath);
				fileName = FILE_PREFIX+fileName;
				let targetDir = path.dirname(uri.fsPath)+"/";
				let newPath = path.join(targetDir+fileName);

				try {
					fs.writeFileSync(newPath, str);
				} catch(error) {
					vscode.window.showErrorMessage(`Failed to write file: ${(error as Error).message}`);
				} finally {
					vscode.window.showInformationMessage(`File minifed to ${newPath}`);
				}
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to read file: ${(error as Error).message}`);
            }
        } else {
            vscode.window.showInformationMessage('No active text editor.');
        }
	});
	context.subscriptions.push(disposable);
}

function replace(str:string, directive:string):string {
	let pos:number = str.indexOf(directive);
	while(pos >= 0) {
		let nameEnd:number = str.indexOf(" ", pos + directive.length);
		let name:string = " " + str.substring(pos+directive.length, nameEnd) + " ";
		name = name.trim();
		let contentEnd:number = str.indexOf("\n", nameEnd+1);
		let content:string = str.substring(nameEnd, contentEnd) + " ";
		content = content.trim();
		// content = removeComment(content);
		content = replaceHash(content);
		
		str = str.slice(0, pos) + str.slice(contentEnd+1);
		str = str.replaceAll(name, content);

		pos = str.indexOf(directive, pos);
	}
	return str;
}

function removeComments(str:string):string {
	let commentStart = str.indexOf("#");
	while(commentStart > 0) {
		let end = str.indexOf("\n", commentStart);
		if(end < 0) {
			end = str.length;
		}
		str = str.slice(0, commentStart) + str.slice(end);

		commentStart = str.indexOf("#", commentStart);
	}
	return str;
}

function toLines(str:string):Array<string> {
	let lines:Array<string> = [];
	let start:number = 0;
	while(start >= 0 && start < str.length) {
		let end:number = str.indexOf("\n", start);
		if(end < 0) {
			end = str.length;
		}

		lines.push(str.substring(start, end));
		start = end+1;
	}
	return lines;
}

function linesToString(lines:Array<string>):string {
	let str:string = "";
	for(let i:number = 0; i < lines.length; i++) {
		str += lines[i] + "\n";
	}
	return str;
}

function removeBlankLines(lines:Array<string>):Array<string> {
	let i:number = 0;
	let ret:Array<string> = [];
	while(i < lines.length) {
		for(let j:number = 0; j < lines[i].length; j++) {
			if(TERMINATE.includes(lines[i][j])) {
				break;
			}
			else if(!IGNORE.includes(lines[i][j])) {
				ret.push(lines[i]);
				break;
			}
		}
		i++;
	}
	return ret;
}

function replaceLabels(lines:Array<string>):string {
	let labels:Map<string,number> = new Map();
	let offset = 0;
	for(let i:number = 0; i < lines.length; i++) {
		let end = lines[i].indexOf(":");
		if(end > 0) {
			let l:string = lines[i].substring(0, end);
			labels.set(l, i);
			lines.splice(i, 1);
			i--;
		}
	}

	let str:string = linesToString(lines);
	let keys = labels.keys;
	for(const element of labels) {
		str = str.replaceAll(element[0], element[1].toString());
	}

	return str;
}

function replaceHash(str:string):string {
	if(str.startsWith(HASH_STRING)) {
		let hashEnd:number = str.indexOf(")");
		let content:string = str.substring(HASH_STRING.length+1, hashEnd-1);
		// vscode.window.showInformationMessage(`Hashing ${content}`);
		return stationeersHash(content).toString();
	}
	return str;
}

function stationeersHash(str:string) {
	let buffer = Buffer.from(str);
	return crc32(buffer);
}

// This method is called when your extension is deactivated
export function deactivate() {}
