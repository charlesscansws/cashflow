function removeDuplicateRows(sheet, lastImportStartRow, lastImportNumRows) {
  // Log the starting point of duplicate removal
  Logger.log(`removeDuplicateRows called for sheet: ${sheet.getName()}`);

  var sheetName = sheet.getName();

  // Define the start row for checking duplicates (row 2 onwards)
  var checkStartRow = 2;
  var lastRow = sheet.getLastRow();
  var checkNumRows = lastRow - checkStartRow + 2;

  // Check if there are enough rows to process
  if (checkNumRows < 1) {
    Logger.log(`No rows to check for duplicates on sheet: ${sheetName}`);
    return;
  }

  // Get all the data from the sheet starting from row 2
  var dataRange = sheet.getRange(checkStartRow, 1, checkNumRows, sheet.getLastColumn());
  var data = dataRange.getValues();

  // Map to store the latest row index for each unique key
  var keyMap = new Map();

  // Identify range of the latest import
  var latestImportEndRow = lastImportStartRow + lastImportNumRows - 1;

  // Iterate over each row, starting from the defined check start row
  for (var i = 0; i < data.length; i++) {
    var sheetRow = i + checkStartRow; // Actual sheet row
    var id = data[i][1]; // Column B has index 1

    // Only consider rows with non-empty IDs
    if (id) {
      // Generate a unique key based on the sheet name
      var uniqueKey = id;

      // Store the row number of the last occurrence of each unique key
      if (!keyMap.has(uniqueKey) || sheetRow > keyMap.get(uniqueKey)) {
        keyMap.set(uniqueKey, sheetRow);
      }
    }
  }

  // Array to store indices of rows to be deleted
  var rowsToDelete = [];

  // Iterate again to find duplicates
  for (var i = 0; i < data.length; i++) {
    var sheetRow = i + checkStartRow; // Actual sheet row
    var id = data[i][1];

    // Only consider rows with non-empty IDs
    if (id) {
      var uniqueKey = id;

      // Check if this row is a duplicate and should be removed
      // Ensure that we only mark rows for deletion if they are before the latest import
      if (keyMap.has(uniqueKey) && keyMap.get(uniqueKey) !== sheetRow && sheetRow < lastImportStartRow) {
        rowsToDelete.push(sheetRow);
      }
    }
  }

  // Delete rows in reverse order to prevent index shift
  rowsToDelete.reverse().forEach(rowIndex => {
    sheet.deleteRow(rowIndex);
  });

  Logger.log(`Removed duplicates based on unique keys in sheet: ${sheetName}`);
}

// Remove account tokens
function removeAccountTokens(accountName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  if (!sheet) {
    return { success: false, error: "Sheet not found" };
  }

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === accountName) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false, error: 'Account not found' };
}

function findAccountRow(accountName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  var dataRange = sheet.getRange('B2:B' + sheet.getLastRow());
  var values = dataRange.getValues();

  for (var i = 0; i < values.length; i++) {
    if (values[i][0].trim() === accountName.trim()) {
      return i + 2; // +2 because sheet rows are 1-indexed and header row is row 1
    }
  }
  throw new Error('Account not found: ' + accountName);
}

function updateRefreshToken(accountName, newRefreshToken) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  var row = findAccountRow(accountName);
  
  sheet.getRange(row, 5).setValue(newRefreshToken); // Column E is the 5th column
  Logger.log('Refresh token updated for account: ' + accountName);
}

// Fetch the list of account names from the "API - Assets" sheet
function getAccountNames() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  if (!sheet) {
    return [];
  }

  var data = sheet.getDataRange().getValues();
  var accounts = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) { // Check for non-empty names
      accounts.push(data[i][0]); // Assuming account names are in the first column
    }
  }

  return accounts;
}

// Execute API calls for all accounts
function executeForAllAccounts(endpoint) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  var data = sheet.getDataRange().getValues();

  // Loop through all rows except the header
  data.slice(1).forEach(function (row) {
    var accountName = row[0];
    try {
      var result = callRevolutAPI(endpoint, accountName);
      Logger.log('Success with account ' + accountName + ': ' + result);
      // Process result as needed
    } catch (e) {
      Logger.log('Error with account ' + accountName + ' on endpoint ' + endpoint + ': ' + e.message);
    }
  });
}

// Add the account name to each row in the sheet where data exists
function addAccountName(sheetName, accountName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }

  // Get the range of data in column B (to determine how many rows have data)
  var dataRange = sheet.getRange('B2:B'); // Assuming data starts from B2
  var dataValues = dataRange.getValues();

  // Find the last row with data in column B
  var lastRow = 1; // Start at 1 because we're skipping the header row
  for (var i = 0; i < dataValues.length; i++) {
    if (dataValues[i][0] !== '') {
      lastRow = i + 2; // Add 2 to account for 0-based index and skipping header
    } else {
      break;
    }
  }

  if (lastRow < 2) {
    Logger.log('No data rows found to update with account name.');
    return;
  }

  // Get the range in column A where account names will be inserted
  var accountNameRange = sheet.getRange(2, 1, lastRow - 1, 1);

  // Prepare account name data to fill
  var accountNames = [];
  for (var j = 0; j < lastRow - 1; j++) {
    accountNames.push([accountName]); // Each row gets the account name
  }

  // Set the account name in the designated range
  accountNameRange.setValues(accountNames);

  Logger.log('Account name added to ' + (lastRow - 1) + ' rows.');
}

function refreshAuthToken(accountName) {
  if (!accountName) {
    throw new Error('Account name is undefined or empty.');
  }

  var tokenUrl = 'https://b2b.revolut.com/api/1.0/auth/token';

  // Get the active spreadsheet and the 'API - Assets' sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  if (!sheet) {
    throw new Error('Sheet "API - Assets" not found.');
  }

  // Fetch the data from the sheet
  var data = sheet.getRange('B2:D').getValues(); // Assuming account names are in column B, client assertion in C, refresh token in D
  var clientAssertionToken = '';
  var refreshToken = '';

  Logger.log('Searching for account name: ' + accountName); // Debugging info

  // Search for the account in the sheet
  for (var i = 0; i < data.length; i++) {
    var currentAccountName = data[i][0] ? data[i][0].trim() : '';
    Logger.log('Checking account name in row: ' + currentAccountName); // Debugging info

    if (currentAccountName === accountName.trim()) {
      clientAssertionToken = data[i][1] || ''; // Assuming client assertion token is in column C
      refreshToken = data[i][2] || ''; // Assuming refresh token is in column D

      Logger.log('Client Assertion Token: ' + clientAssertionToken); // Debugging info
      Logger.log('Refresh Token: ' + refreshToken); // Debugging info

      if (clientAssertionToken && refreshToken) {
        break;
      }
    }
  }

  // Validate if tokens are found
  if (!clientAssertionToken) {
    Logger.log('Client assertion token is empty for account: ' + accountName);
    throw new Error('Client assertion token not found or empty for account: ' + accountName);
  }

  if (!refreshToken) {
    Logger.log('Refresh token is empty for account: ' + accountName);
    throw new Error('Refresh token not found or empty for account: ' + accountName);
  }

  // Prepare the payload for the token refresh request
  var payload = {
    'grant_type': 'refresh_token',
    'refresh_token': refreshToken,
    'client_assertion_type': 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    'client_assertion': clientAssertionToken
  };

  // Manually encode the payload as a query string
  var encodedPayload = Object.keys(payload)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(payload[key]))
    .join('&');

  var options = {
    'method': 'post',
    'contentType': 'application/x-www-form-urlencoded',
    'payload': encodedPayload,
    'muteHttpExceptions': true
  };

  try {
    // Perform the HTTP POST request to refresh the token
    var response = UrlFetchApp.fetch(tokenUrl, options);
    var responseCode = response.getResponseCode();
    var responseBody = JSON.parse(response.getContentText());

    if (responseCode !== 200) {
      // Log the full response for debugging
      Logger.log('Response Code: ' + responseCode);
      Logger.log('Response Body: ' + JSON.stringify(responseBody));
      throw new Error('Failed to refresh token. Response: ' + (responseBody.error || 'unknown error'));
    }

    return responseBody.access_token; // Return the new access token
  } catch (e) {
    throw new Error('Failed to refresh token: ' + e.message);
  }
}

// Save tokens for a specific account
function saveAccountTokens(accountName, clientAssertion, refreshToken) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  if (!sheet) {
    return { success: false, error: "Sheet not found" };
  }

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === accountName) {
      sheet.getRange(i + 1, 2).setValue(clientAssertion);
      sheet.getRange(i + 1, 3).setValue(refreshToken);
      return { success: true, accountId: i + 1 };
    }
  }

  sheet.appendRow([accountName, clientAssertion, refreshToken]);
  return { success: true, accountId: sheet.getLastRow() };
}

function executeForSelectedAccount(endpoint, accountName) {
  Logger.log('Starting API call for account: ' + accountName + ' on endpoint: ' + endpoint);
  
  try {
    callRevolutAPI("accounts", accountName);
    Logger.log('API call successful for account: ' + accountName);
  } catch (e) {
    Logger.log('Error during API call for account: ' + accountName + ' on endpoint: ' + endpoint + ' - ' + e.message);
  }
}

function updateAccountTokens(accountName, newClientAssertion) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  if (!sheet) {
    throw new Error('Sheet not found: API - Assets');
  }

  var data = sheet.getRange('B2:E').getValues(); // Get values from columns B to E
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === accountName) {
      Logger.log('Updating client assertion token for account: ' + accountName);
      sheet.getRange(i + 2, 5).setValue(newClientAssertion); // Update Client Assertion Token in column E
      break;
    }
  }
}

function getAccountTokens(accountName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  if (!sheet) {
    throw new Error('Sheet not found: API - Assets');
  }
  
  var data = sheet.getRange('B2:E').getValues(); // Get values from columns B to E
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === accountName) {
      Logger.log('Retrieved tokens for account: ' + accountName);
      return {
        clientAssertion: data[i][2], // Client Assertion is in column C
        refreshToken: data[i][3] // Refresh Token is in column D
      };
    }
  }
  
  return null;
}
