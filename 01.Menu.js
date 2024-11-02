function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Revolut')
      .addItem('Revolut All in One', 'showSidebar')
      .addToUi();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('sidebar').setTitle('Revolut All in One');
  SpreadsheetApp.getUi().showSidebar(html);
}