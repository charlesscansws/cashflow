// Open the sidebar
function openDeleteCounterpartySidebar() {
  var html = HtmlService.createHtmlOutputFromFile('DeleteCounterpartyForm')
    .setWidth(800)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Delete Counterparty');
}

// Fetch unique account and counterparty names for dropdown filters
function getDropdownData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Counterparties');

  // Get unique account names from column B and counterparty names from column D
  const accountNames = [...new Set(sheet.getRange("B2:B" + sheet.getLastRow()).getValues().flat())].filter(name => name);
  const counterpartyNames = [...new Set(sheet.getRange("D2:D" + sheet.getLastRow()).getValues().flat())].filter(name => name);

  return {
    accounts: accountNames,
    counterparties: counterpartyNames
  };
}

// Retrieve counterparties based on selected account and counterparty filters
function getFilteredCounterparties(accountName, counterpartyName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Counterparties');
  const data = sheet.getDataRange().getValues();
  
  const filteredData = data.slice(1).filter(row => {
    const matchesAccount = accountName ? row[1] === accountName : true;  // Column B for accountName
    const matchesCounterparty = counterpartyName ? row[3] === counterpartyName : true;  // Column D for item.name
    return matchesAccount && matchesCounterparty;
  }).map(row => ({
    checkbox: row[0],          // Checkbox from Column A
    accountName: row[1],       // Account Name from Column B
    counterpartyName: row[3],  // Counterparty Name from Column D
    counterpartyId: row[2]     // Counterparty ID from Column C
  }));

  return filteredData;
}

// Delete selected counterparties using Revolut API
function deleteCounterparties(idsToDelete) {
  const token = getAuthToken(); // Function that retrieves the Bearer token from the tokens script
  const baseUrl = 'https://b2b.revolut.com/api/1.0/counterparty/';

  const responses = idsToDelete.map(id => {
    const url = `${baseUrl}${id}`;
    const options = {
      method: 'delete',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    };
    const response = UrlFetchApp.fetch(url, options);
    const status = response.getResponseCode();

    if (status === 204) { // 204 No Content indicates successful deletion
      return { success: true, id };
    } else {
      const error = JSON.parse(response.getContentText()).message;
      return { success: false, id, error };
    }
  });

  const failed = responses.filter(res => !res.success);
  return {
    success: failed.length === 0,
    error: failed.length > 0 ? failed.map(res => `Failed to delete ID ${res.id}: ${res.error}`).join(', ') : null
  };
}

function XgetSelectedCounterpartiesForDeletion() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Counterparties');
  if (!sheet) {
    Logger.log("Sheet 'API - Counterparties' not found");
    return [];
  }

  const checkboxes = sheet.getRange('A2:A' + sheet.getLastRow()).getValues();
  const ids = sheet.getRange('C2:C' + sheet.getLastRow()).getValues();
  
  const idsToDelete = [];
  
  for (let i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i][0] === true) {  // Check if the checkbox is checked
      idsToDelete.push(ids[i][0]);  // Get the corresponding counterparty_id from column C
    }
  }
  
  return idsToDelete;
}