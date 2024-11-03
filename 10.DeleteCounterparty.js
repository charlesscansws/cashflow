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
function deleteCounterparties(accountName, ids) {
  if (!accountName) {
    throw new Error('Account name is required for deletion.');
  }

  const token = getAuthToken(accountName);
  if (!token) {
    throw new Error(`Failed to retrieve token for account: ${accountName}`);
  }

  ids.forEach(counterparty_id => {
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

      if (responseCode === 200) {
        console.log(`Counterparty ${counterparty_id} deleted successfully.`);
      } else {
        console.error(`Failed to delete counterparty ${counterparty_id}. Response: ${response.getContentText()}`);
      }
    } catch (error) {
      console.error(`Error deleting counterparty ${counterparty_id}: ${error.message}`);
    }
  });
}
}
// Delete selected counterparties using Revolut API

function deleteSelectedCounterparties() {
  const accountName = document.getElementById('accountFilter').value;
  if (!accountName) {
    showMessage('Please select an account name.', 'error');
    return;
  }

  const checkboxes = document.querySelectorAll('#counterpartyTable input[type="checkbox"]:checked');
  const idsToDelete = Array.from(checkboxes).map(cb => cb.value);

  if (idsToDelete.length > 0) {
    showMessage('In progress...', 'success');

    // Confirm that idsToDelete is an array before passing it
    if (!Array.isArray(idsToDelete)) {
      console.error("Error: idsToDelete is not an array.", idsToDelete);
      return;
    }

    google.script.run.withSuccessHandler(function(response) {
      if (response.success) {
        showMessage('Counterparties deleted successfully.', 'success');
        searchCounterparties(); // Refresh the table
      } else {
        showMessage('Error: ' + response.error, 'error');
      }
    }).withFailureHandler(function(error) {
      showMessage('Error: ' + error.message, 'error');
    }).deleteCounterparties(accountName, idsToDelete);
  } else {
    showMessage('Please select at least one counterparty to delete.', 'error');
  }
}

function deleteCounterparties(accountName, ids) {
  if (!Array.isArray(ids)) {
    console.error("Error: 'ids' is not an array. Received:", ids);
    throw new TypeError("Expected 'ids' to be an array of counterparty IDs.");
  }

  if (!accountName) {
    throw new Error('Account name is required for deletion.');
  }

  const token = getAuthToken(accountName);
  if (!token) {
    throw new Error(`Failed to retrieve token for account: ${accountName}`);
  }

  ids.forEach(counterparty_id => {
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

      if (responseCode === 200) {
        console.log(`Counterparty ${counterparty_id} deleted successfully.`);
      } else {
        console.error(`Failed to delete counterparty ${counterparty_id}. Response: ${response.getContentText()}`);
      }
    } catch (error) {
      console.error(`Error deleting counterparty ${counterparty_id}: ${error.message}`);
    }
  });
}


