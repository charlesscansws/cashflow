function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Revolut')
      .addItem('Revolut All in One', 'showSidebar')
      .addItem('Monitor', 'showMail')
      .addItem('Source Sheet', 'showSourceSheet')
      .addToUi();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('sidebar').setTitle('Revolut All in One');
  SpreadsheetApp.getUi().showSidebar(html);
}


function showMail() {
  var html = HtmlService.createHtmlOutputFromFile('menuMail')
    .setWidth(1600)
    .setHeight(1200);
  SpreadsheetApp.getUi().showModalDialog(html, 'Mail');
}


function showSourceSheet() {
  var html = HtmlService.createHtmlOutputFromFile('sourceSheet')
      .setWidth(800)
      .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, 'Import Data');
}
