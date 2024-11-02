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
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();

  // Filter data based on selections
  const filteredData = data
    .filter(row => (accountName ? row[1] === accountName : true) &&
                   (counterpartyName ? row[3] === counterpartyName : true))
    .map(row => ({
      counterpartyId: row[2],  // Assume this is the counterparty_id
      accountName: row[1],
      counterpartyName: row[3]
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

function deleteSelectedCounterparties() {
  const checkboxes = document.querySelectorAll('#counterpartyTable input[type="checkbox"]:checked');
  const itemsToDelete = Array.from(checkboxes).map(cb => ({
    counterpartyId: cb.value,
    accountName: cb.getAttribute('data-account-name') // Retrieve account name
  }));

  if (itemsToDelete.length > 0) {
    showMessage('In progress...', 'success');
    
    google.script.run.withSuccessHandler(function(response) {
      if (response.success) {
        showMessage('Counterparties deleted successfully.', 'success');
        searchCounterparties(); // Refresh the table
      } else {
        showMessage('Error: ' + response.error, 'error');
      }
    }).withFailureHandler(function(error) {
      showMessage('Error: ' + error.message, 'error');
    }).deleteCounterparties(itemsToDelete); // Pass both counterpartyId and accountName
  } else {
    showMessage('Please select at least one counterparty to delete.', 'error');
  }
}

function deleteCounterparties(items) {
  items.forEach(item => {
    const { counterpartyId, accountName } = item; // Destructure to get each id and account
    const token = getAuthToken(accountName); // Fetch token based on account name

    const url = `https://b2b.revolut.com/api/1.0/counterparty/${counterpartyId}`;
    const options = {
      method: 'delete',
      headers: {
        Authorization: `Bearer ${token}`
      },
      muteHttpExceptions: true
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      const statusCode = response.getResponseCode();
      
      if (statusCode === 200) {
        Logger.log(`Counterparty ${counterpartyId} deleted successfully.`);
      } else {
        Logger.log(`Failed to delete counterparty ${counterpartyId}: ${response.getContentText()}`);
      }
    } catch (error) {
      Logger.log(`Error deleting counterparty ${counterpartyId}: ${error}`);
    }
  });

  return { success: true };
}
