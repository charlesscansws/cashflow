function showLogin() {
  var html = HtmlService.createHtmlOutputFromFile('login')
      .setWidth(800)
      .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(html, 'Login your Revolut Accounts');
}

function getExistingAccounts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  const data = sheet.getRange('B2:D').getValues();
  return data.filter(row => row[0]); // Filter out rows where Account Name is empty
}

function checkForDuplicate(accountName, clientAssertion, refreshToken) {
  const existingAccounts = getExistingAccounts();
  return existingAccounts.some(row => 
    row[0] === accountName || row[1] === clientAssertion || row[2] === refreshToken);
}

function saveAccount(accountName, clientAssertion, refreshToken) {
  if (checkForDuplicate(accountName, clientAssertion, refreshToken)) {
    return { success: false, message: "Duplicate account detected." };
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 2, 1, 3).setValues([[accountName, clientAssertion, refreshToken]]);
  return { success: true };
}

function updateAccount(index, accountName, clientAssertion, refreshToken) {
  if (checkForDuplicate(accountName, clientAssertion, refreshToken)) {
    return { success: false, message: "Duplicate account detected." };
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  const rowIndex = parseInt(index) + 2; // Convert index to row number in the sheet
  sheet.getRange(rowIndex, 2, 1, 3).setValues([[accountName, clientAssertion, refreshToken]]);
  return { success: true };
}

function removeAccount(index) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  const rowIndex = parseInt(index) + 2; // Convert index to row number in the sheet
  sheet.deleteRow(rowIndex);
}
