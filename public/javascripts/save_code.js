/*
	Dependencies:
	- jQuery (included)
	- jQuery doTimeout (included) http://benalman.com/projects/jquery-dotimeout-plugin/
	- diff-match-patch (included) https://code.google.com/p/google-diff-match-patch/
	- Ace (check out from GitHub into pwd) https://github.com/ajaxorg/ace-builds
*/

class CodeSaveController {
	constructor() {
		this.dmp = new diff_match_patch();
		this.DEBOUNCE_MS = 5000;// milliseconds of debouncing (i.e., 'clustering' a
								// rapid series of edit actions as a single diff)
								// set to 'null' for no debouncing
		this.editor = null;
		this.curText = '';

		this.init();
	}

	init() {
		// Get the editor instance instantiated from controller.js
		this.editor = ace.edit("editor");
		this.addContentChangeHandler();
	}

	addContentChangeHandler() {
		function snapshotDiff(self) {
			var newText = self.editor.getValue();
			var timestamp = new Date().getTime();

			if (self.curText != newText) {
				/*
				The two key function calls here are diff_main followed by diff_toDelta
				Each 'd' field is in the following format:
				http://downloads.jahia.com/downloads/jahia/jahia6.6.1/jahia-root-6.6.1.0-aggregate-javadoc/name/fraser/neil/plaintext/DiffMatchPatch.html#diff_toDelta(java.util.LinkedList)
				Crush the diff into an encoded string which describes the operations
				required to transform text1 into text2. E.g. =3\t-2\t+ing -> Keep 3
				chars, delete 2 chars, insert 'ing'. Operations are tab-separated.
				Inserted text is escaped using %xx notation.
				*/
				var delta = {
					t: timestamp,
					d: self.dmp.diff_toDelta(self.dmp.diff_main(self.curText, newText))
				};
				self.sendCodeEditSaveRequest(delta);
				self.curText = newText;
		  	}
		}

		this.editor.on('change', (e) => {
			if (this.DEBOUNCE_MS > 0) {
				$.doTimeout('editorChange', this.DEBOUNCE_MS, () => { snapshotDiff(this); });
			} else {
				snapshotDiff(this);
			}
		});
	}

	sendCodeEditSaveRequest(delta) {
		var data = {
			command: CODE_EDIT_SAVE_COMMAND,
			userName: USER_NAME,
			delta: delta,
			code: this.editor.getValue()
		}
		var URL = LAB_URL + "/" + LAB_ID;
		$.post(
		{
			url: URL,
			data: JSON.stringify(data),
			success: (data, status) => {
				// ...
			},
			error: (req, status, err) => {
				console.log(err);
			},
			dataType: "json",
			contentType: "application/json"
		});
	}
}

$(document).ready(function() {
	var codeSaveCtrl = new CodeSaveController();
});
 