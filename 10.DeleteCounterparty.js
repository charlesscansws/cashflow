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
  
  // Get account names and IDs from columns B and C and ensure uniqueness by name
  const accountData = sheet.getRange("B2:C" + sheet.getLastRow()).getValues();
  const uniqueAccounts = {};
  accountData.forEach(row => {
    const [accountName, accountId] = row;
    if (accountName && accountId && !uniqueAccounts[accountName]) {
      uniqueAccounts[accountName] = { accountName, accountId };
    }
  });
  const accounts = Object.values(uniqueAccounts);

  // Get counterparty names and IDs from columns C and E and ensure uniqueness by name
  const counterpartyData = sheet.getRange("C2:E" + sheet.getLastRow()).getValues();
  const uniqueCounterparties = {};
  counterpartyData.forEach(row => {
    const [counterpartyId, , counterpartyName] = row;
    if (counterpartyName && counterpartyId && !uniqueCounterparties[counterpartyName]) {
      uniqueCounterparties[counterpartyName] = { counterpartyName, counterpartyId };
    }
  });
  const counterparties = Object.values(uniqueCounterparties);

  return {
    accounts,
    counterparties
  };
}

// Retrieve counterparties based on selected account and counterparty filters
function getFilteredCounterparties(accountName, counterpartyName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Counterparties');
  const data = sheet.getDataRange().getValues(); // Fetch all data from the sheet
  const headers = data[0]; // Assuming first row is headers
  const accountNameIndex = headers.indexOf("accountName");
  const counterpartyNameIndex = headers.indexOf("counterpartyName");
  const counterpartyIdIndex = headers.indexOf("counterparty_id");

  const filteredData = data.slice(1) // Remove header row
    .filter(row => {
      const matchesAccount = accountName ? row[accountNameIndex] === accountName : true;
      const matchesCounterparty = counterpartyName ? row[counterpartyNameIndex] === counterpartyName : true;
      return matchesAccount && matchesCounterparty;
    })
    .map(row => ({
      accountName: row[accountNameIndex],
      counterpartyName: row[counterpartyNameIndex],
      counterpartyId: row[counterpartyIdIndex]
    }));

  return filteredData;
}

// Delete selected counterparties using Revolut API
function deleteCounterparties(idsToDelete) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Counterparties');
  if (!sheet) {
    Logger.log("Sheet 'API - Counterparties' not found");
    return { success: false, error: "Sheet 'API - Counterparties' not found" };
  }

  // Loop through each ID and send a DELETE request
  const apiUrl = 'https://b2b.revolut.com/api/1.0/counterparty/';
  let errors = [];
  
  idsToDelete.forEach(id => {
    const url = apiUrl + id;
    const options = {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + getBearerToken(), // replace with your function to retrieve the token
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    
    if (statusCode !== 200 && statusCode !== 204) {
      Logger.log(`Failed to delete counterparty with ID ${id}. Status: ${statusCode}`);
      errors.push(`Failed to delete counterparty with ID ${id}.`);
    }
  });

  if (errors.length > 0) {
    return { success: false, error: errors.join(" ") };
  } else {
    // Clear checkboxes after deletion
    const checkboxRange = sheet.getRange('A2:A' + sheet.getLastRow());
    checkboxRange.uncheck();
    return { success: true };
  }
}

function getSelectedCounterpartiesForDeletion() {
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
