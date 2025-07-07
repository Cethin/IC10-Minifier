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
const IGNORE:Array<string> = [" ", "\t"];
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
                let fileString = Buffer.from(content).toString();
				fileString = removeComments(fileString);
				fileString = replace(fileString, DEFINE_STRING);
				fileString = replace(fileString, ALIAS_STRING);
				fileString = removeBlankLines(fileString);

				// Save to new file
				let fileName = path.basename(uri.fsPath);
				fileName = FILE_PREFIX+fileName;
				let targetDir = path.dirname(uri.fsPath)+"/";
				let newPath = path.join(targetDir+fileName);

				try {
					fs.writeFileSync(newPath, fileString);
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

// function removeComment(str:string):string {
// 	let commentStart = str.indexOf("#");
// 	if(commentStart > 0) {
// 		return str.substring(0, commentStart);
// 	}
// 	return str;
// }

function removeBlankLines(str:string):string {
	let start:number = 0;
	while(start >= 0 && start < str.length) {
		let pos:number = start+1;
		let end:number = str.indexOf("\n", start+1);
		if(end < 0) {
			end = str.length;
		}
		while(pos < str.length) {
			let c = str[pos];
			if(TERMINATE.includes(c)) {
				// let end = pos;
				str = str.slice(0, start) + str.slice(end + (start===0?2:0));
				end = start;
				break;
			}
			else if(!IGNORE.includes(c)) {
				break;
			}
			pos++;
		}

		start = end;
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
