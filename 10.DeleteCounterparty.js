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
  const accountNames = [...new Set(sheet.getRange("B2:B").getValues().flat())].filter(name => name);
  const counterpartyNames = [...new Set(sheet.getRange("E2:E").getValues().flat())].filter(name => name);

  return {
    accounts: accountNames,
    counterparties: counterpartyNames
  };
}

// Retrieve counterparties based on selected account and counterparty filters
function getFilteredCounterparties(accountName, counterpartyName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Counterparties');
  const data = sheet.getDataRange().getValues().slice(1); // Exclude header row

  const filteredData = data.filter(row => 
    (accountName ? row[0] === accountName : true) &&
    (counterpartyName ? row[6] === counterpartyName : true)
  ).map(row => ({
    counterparty_id: row[1],  // Assuming counterparty ID is in column B
    account_name: row[0],     // Account name in column A
    counterparty_name: row[6] // Counterparty name in column G
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
