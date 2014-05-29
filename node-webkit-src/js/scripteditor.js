;(function() {
  'use strict';

  var events = require('events');

  var editor = null;
  var emitter = new events.EventEmitter();
  var expandNotes = false;
  var autoIndent = true;

  var toggleExpandNotes = function(value) {
    if (typeof(value) !== 'undefined') {
      expandNotes = value;
    }
    else {
      expandNotes = !expandNotes;
    }
    if (expandNotes) {
      editor.execCommand('unfoldAll');
    }
    else {
      editor.execCommand('foldAll');
    }
    emitter.emit('expandNotes:change', expandNotes);
  };

  var toggleAutoIndent = function(value) {
    if (value) {
      autoIndent = value;
    }
    else {
      autoIndent = !autoIndent;
    }
    if (autoIndent) {
      $('.CodeMirror').addClass('auto-indent');
    }
    else {
      $('.CodeMirror').removeClass('auto-indent');
    }
    emitter.emit('autoIndent:change', autoIndent);
  };

  var cancelDebouncePropagate = false;

  var propagate = function(force) {
    toggleExpandNotes(expandNotes);
    if (cancelDebouncePropagate) {
      cancelDebouncePropagate = false;
      return;
    }
    // total hack. don't propagate a board change back to fountain manager
    if (force || ui.getActiveState() == 'script') {
      fountainManager.loadChange(editor.getDoc().getValue());
    }
  };

  var toEdit = ' ';

  var init = function() {
    window.editor = editor = CodeMirror($('#scripttext')[0], {
      value: toEdit,
      mode: 'fountain',
      viewportMargin: Infinity,
      theme: 'neo',
      lineWrapping: true
    })
    editor.options.foldOptions = {
      rangeFinder: CodeMirror.fold.note,
      widget: "[[Storyboards]]",
      minFoldSize: 0,
      scanUp: false,
      clearOnClick: false,
      clearOnEnter: false,
      atomic: true
    };
    editor.getDoc().on('change', debounce(propagate, 3000));
    ui.emitter.on('activeState:change', function(state) {
      switch (state) {
        case 'boards':
          cancelDebouncePropagate = true;
          propagate(true);
          break;

        case 'script':
          cancelDebouncePropagate = false;
          refresh();
          break;
      }
    });
    toggleExpandNotes(false);
    toggleAutoIndent(true);
  };

  fountainManager.emitter.on('script:change', function(text, oldText, fromScriptEditor) {
    if (fromScriptEditor) return;
    console.log('script:change');
    if (editor) {
      editor.getDoc().setValue(text);
      toggleExpandNotes(expandNotes);
    }
    else {
      toEdit = text;
    }
  });

  var refresh = function() {
    if (editor) editor.refresh();
    editor.focus();
  };

  var scriptEditor = window.scriptEditor = {
    emitter: emitter,
    toggleAutoIndent: toggleAutoIndent,
    getAutoIndent: function() { return autoIndent; },
    toggleExpandNotes: toggleExpandNotes,
    getExpandNotes: function() { return expandNotes; },
    refresh: refresh
  };

  // force initial event fires
  $(document).ready(function() {
    init();
  });

}).call(this);