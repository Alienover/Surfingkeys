var markdownBody = document.querySelector('.markdown-body');
var markdown_editor = createMarkdownEditor('markdown-editor');
function previewMarkdown(mk) {
  Front.source = mk;

  if (runtime.conf.useLocalMarkdownAPI) {
    setInnerHTML(markdownBody, marked(mk));
  } else {
    setInnerHTML(markdownBody, 'Loading preview…');
    httpRequest(
      {
        url: 'https://api.github.com/markdown/raw',
        data: mk,
      },
      function(res) {
        setInnerHTML(markdownBody, res.text);
      }
    );
  }
  if (!markdown_editor.getValue()) {
    markdown_editor.setValue(mk);
  }
}

var markdown_update_timer = null;
markdown_editor.on('change', function(e) {
  if (!!markdown_update_timer) {
    clearTimeout(markdown_update_timer);
  }

  markdown_update_timer = setTimeout(function() {
    var content = markdown_editor.getValue();
    if (content !== Front.source) {
      previewMarkdown(content);
    }
  }, 1000);
});
function createMarkdownEditor(elmId) {
  var _ace = ace.edit(elmId);
  _ace.$blockScrolling = Infinity;
  _ace.setTheme('ace/theme/chrome');

  _ace.setKeyboardHandler('ace/keyboard/vim');

  _ace.setOptions({
    wrap: true,
    showPrintMargin: false,
    mode: 'ace/mode/markdown',
    theme: 'ace/theme/chrome',
    autoScrollEditorIntoView: true,
  });

  return _ace;
}

mapkey('sm', '#99Edit markdown source', function() {
  Front.showEditor(Front.source, previewMarkdown, 'markdown');
});

mapkey(';s', '#99Switch markdown parser', function() {
  runtime.conf.useLocalMarkdownAPI = !runtime.conf.useLocalMarkdownAPI;
  previewMarkdown(Front.source);
});

mapkey('cc', '#99Copy generated html code', function() {
  Clipboard.write(markdownBody.innerHTML);
});

var mdUrl = window.location.search.substr(3);

if (mdUrl !== '') {
  httpRequest(
    {
      url: mdUrl,
    },
    function(res) {
      previewMarkdown(res.text);
    }
  );
} else {
  Front.renderDataFromClipboard = previewMarkdown;
}

var reader = new FileReader(),
  inputFile;
reader.onload = function() {
  previewMarkdown(reader.result);
  markdown_editor.setValue(reader.result);
};
function previewMarkdownFile() {
  reader.readAsText(inputFile);
}
var inputFileDiv = document.querySelector('input[type=file]');
inputFileDiv.onchange = function(evt) {
  if (!inputFile) {
    mapkey('or', '#99Reload from selected local file.', function() {
      previewMarkdownFile();
      Front.showBanner('Reloaded!', 100);
    });
    Front.renderHeaderDescription();
  }
  inputFile = evt.target.files[0];
  previewMarkdownFile();
};

mapkey('of', '#99Open local file.', function() {
  inputFileDiv.click();
});
mapkey(';d', '#99Save file to local', function() {
  var aTag = document.createElement('a');
  var blob = new Blob([Front.source]);
  aTag.download = 'markdown_' + new Date().getTime() + '.md';
  aTag.href = URL.createObjectURL(blob);
  aTag.click();
  URL.revokeObjectURL(blob);
});
