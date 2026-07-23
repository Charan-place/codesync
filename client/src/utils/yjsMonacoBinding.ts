import * as Y from 'yjs';
import type * as MonacoNS from 'monaco-editor';

// Minimal, dependency-free Yjs <-> Monaco binding.
//
// Rather than pulling in y-monaco (which statically imports the raw
// `monaco-editor` package and breaks this project's bundler resolution),
// we bind directly to the `monaco` namespace that @monaco-editor/react
// already loads at runtime via its CDN/worker loader.
//
// Sync strategy: on every remote Yjs change we diff the model's current text
// against the new Yjs text (common-prefix/common-suffix trim) and apply a
// single minimal edit, which keeps cursor jumps small for normal typing.
// Local edits are converted to yText.insert/delete calls inside a tagged
// transaction so we can tell our own echoes apart from real remote updates.
export class YjsMonacoBinding {
  private yText: Y.Text;
  private model: MonacoNS.editor.ITextModel;
  private applyingRemote = false;
  private applyingLocal = false;
  private readonly localOrigin = Symbol('local-monaco-edit');
  private disposable: MonacoNS.IDisposable;
  private observer: (event: Y.YTextEvent, tr: Y.Transaction) => void;

  constructor(yText: Y.Text, model: MonacoNS.editor.ITextModel) {
    this.yText = yText;
    this.model = model;

    // Initial sync: whichever side already has content wins.
    const initial = yText.toString();
    if (initial) {
      model.setValue(initial);
    } else if (model.getValue()) {
      yText.insert(0, model.getValue());
    }

    this.observer = (_event, tr) => {
      if (tr.origin === this.localOrigin) return; // our own echo, model already matches
      this.applyRemoteToModel();
    };
    yText.observe(this.observer);

    this.disposable = model.onDidChangeContent((event) => {
      if (this.applyingRemote) return;
      this.applyingLocal = true;
      yText.doc?.transact(() => {
        // Apply changes in reverse order so earlier offsets stay valid.
        const changes = [...event.changes].sort((a, b) => b.rangeOffset - a.rangeOffset);
        for (const change of changes) {
          if (change.rangeLength > 0) {
            yText.delete(change.rangeOffset, change.rangeLength);
          }
          if (change.text.length > 0) {
            yText.insert(change.rangeOffset, change.text);
          }
        }
      }, this.localOrigin);
      this.applyingLocal = false;
    });
  }

  private applyRemoteToModel() {
    if (this.applyingLocal) return;
    const newValue = this.yText.toString();
    const oldValue = this.model.getValue();
    if (newValue === oldValue) return;

    let start = 0;
    const minLen = Math.min(oldValue.length, newValue.length);
    while (start < minLen && oldValue[start] === newValue[start]) start++;
    let endOld = oldValue.length;
    let endNew = newValue.length;
    while (endOld > start && endNew > start && oldValue[endOld - 1] === newValue[endNew - 1]) {
      endOld--;
      endNew--;
    }

    const startPos = this.model.getPositionAt(start);
    const endPos = this.model.getPositionAt(endOld);
    const insertText = newValue.slice(start, endNew);

    this.applyingRemote = true;
    this.model.applyEdits([
      {
        range: {
          startLineNumber: startPos.lineNumber,
          startColumn: startPos.column,
          endLineNumber: endPos.lineNumber,
          endColumn: endPos.column,
        },
        text: insertText,
      },
    ]);
    this.applyingRemote = false;
  }

  destroy() {
    this.yText.unobserve(this.observer);
    this.disposable.dispose();
  }
}
