
/* IMPORT */

import * as _ from 'lodash';
import * as vscode from 'vscode';
import Consts from './consts';
import Editor from './editor';

/* TOGGLE RULES */

async function toggleRules ( ...rules ) {

  const textEditor = vscode.window.activeTextEditor;

  if ( !Editor.isSupported ( textEditor ) ) return;

  const textDocument = textEditor.document,
        lines = _.uniq ( textEditor.selections.map ( selection => textDocument.lineAt ( selection.active.line ) ) );

  if ( !lines.length ) return;

  const edits = [];

  lines.forEach ( line => {

    rules.find ( ([ regex, replacement ]) => {

      if ( !regex.test ( line.text ) ) return false;

      const nextText = line.text.replace ( regex, replacement );

      edits.push ( ..._.filter ( _.flattenDeep ( lines.map ( line => Editor.edits.makeDiff ( line.text, nextText, line.lineNumber ) ) ) ) );

      return true;

    });

  });

  if ( !edits.length ) return;

  await Editor.edits.apply ( textEditor, edits );

}

/* COMMANDS */

function toggleTodo () {

  const {bullet} = Consts.symbols,
        {line, todoBox, todoDone} = Consts.regexes;

  toggleRules (
    [todoBox, '$1$3'],
    [todoDone, `$1${bullet} [ ] $3`],
    [line, `$1${bullet} [ ] $3`]
  );

}

function toggleDone () {

  const {bullet, done} = Consts.symbols,
        {line, todoBox, todoDone} = Consts.regexes;

  toggleRules (
    [todoDone, `$1${bullet} [ ] $3`],
    [todoBox, `$1${bullet} [${done}] $3 (@done ${ new Date().toJSON() })`],
    [line, `$1${bullet} [${done}] $3 (@done ${ new Date().toJSON() })`]
  );

}

function archive () {

  const editor = vscode.window.activeTextEditor;
  if (editor) {
    var cursorline = editor.document.lineAt(editor.selection.active.line);
    var textRange = new vscode.Range(cursorline.range.start, cursorline.range.end);
    let todoItem = editor.document.getText(textRange);
    
    let archiveIndex = editor.document.getText().indexOf('### Archive') + 11;
    let archivePos = editor.document.positionAt(archiveIndex);

    editor.edit(editBuilder => {
      editBuilder.insert(archivePos, `\n${ todoItem }`);
      editBuilder.delete(textRange);
      // editBuilder.delete(new vscode.Range(editor.selection.active-1, editor.selection.active))
    });
  }
}

/* EXPORT */

export {toggleTodo, toggleDone, archive};
