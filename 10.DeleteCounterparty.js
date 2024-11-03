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
  const dataRange = sheet.getRange(2, 2, sheet.getLastRow() - 1, 8).getValues(); // Adjust column range as needed

  const filteredData = dataRange.filter(row => {
    const matchesAccount = !accountName || row[0] === accountName;
    const matchesCounterparty = !counterpartyName || row[2] === counterpartyName; // Column D now for counterparty name
    return matchesAccount && matchesCounterparty;
  }).map(row => ({
    counterpartyId: row[1],             // Corrected to pull ID from column C
    counterpartyName: row[2],           // Corrected to pull name from column D
    accountNo: row[4],                  // Column F for account number
    sortCode: row[5],                   // Column G for sort code
    iban: row[6]                        // Column H for IBAN
  }));

  return filteredData;
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
// Delete selected counterparties using Revolut API
function deleteCounterparties(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    console.error("Error: 'ids' is not an array or is empty. Received:", ids);
    throw new TypeError("Expected 'ids' to be a non-empty array of counterparty IDs.");
  }

  // Fetch the account name associated with the token if needed
  const accountName = 'YourAccountName'; // Replace with dynamic logic if necessary

  const token = getAuthToken(accountName);
  if (!token) {
    throw new Error(`Failed to retrieve token for account: ${accountName}`);
  }

  const results = ids.map(counterparty_id => {
    const url = `https://b2b.revolut.com/api/1.0/counterparty/${counterparty_id}`;
    const options = {
      method: "delete",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      muteHttpExceptions: true
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();

      if (responseCode === 204) {
        console.log(`Counterparty ${counterparty_id} deleted successfully.`);
        return { id: counterparty_id, success: true };
      } else {
        const responseBody = response.getContentText();
        console.error(`Failed to delete counterparty ${counterparty_id}. Response Code: ${responseCode}, Response Body: ${responseBody}`);
        return { id: counterparty_id, success: false, error: responseBody };
      }
    } catch (error) {
      console.error(`Error deleting counterparty ${counterparty_id}: ${error.message}`);
      return { id: counterparty_id, success: false, error: error.message };
    }
  });

  return { success: results.every(r => r.success), results };
}


