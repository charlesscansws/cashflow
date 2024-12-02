function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Revolut')
      .addItem('Revolut All in One', 'showSidebar')
      .addItem('Monitor', 'showMail')
      .addItem('Source Sheet', 'showSourceSheet')
      .addItem('Payment', 'showPayment')
      .addItem('Cash Flow', 'showCashFlow')
      .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('sidebar').setTitle('Revolut All in One');
  SpreadsheetApp.getUi().showSidebar(html);
}

function showMail() {
  const html = HtmlService.createHtmlOutputFromFile('menuMail')
      .setWidth(1600)
      .setHeight(1200);
  SpreadsheetApp.getUi().showModalDialog(html, 'Mail');
}

function showSourceSheet() {
  const html = HtmlService.createHtmlOutputFromFile('sourceSheet')
      .setWidth(800)
      .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, 'Import Data');
}

function showPayment() {
  const html = HtmlService.createHtmlOutputFromFile('payment')
      .setWidth(800)
      .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, 'Cash Flow Payment');
}


function showCashFlow() {
  const html = HtmlService.createHtmlOutputFromFile('cashFlow')
      .setWidth(1200)
      .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Cash Flow Dashboard');
}