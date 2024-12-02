///https://developer.revolut.com/docs/guides/manage-accounts/counterparties/create-a-counterparty///
////https://developer.revolut.com/docs/business/add-counterparty////////////
function showAddCounterpartyForm() {
  var html = HtmlService.createHtmlOutputFromFile('AddCounterpartyForm')
    .setWidth(800)
    .setHeight(1000);
  SpreadsheetApp.getUi().showModalDialog(html, 'Add Counterparty');
}

function getAccounts() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  if (!sheet) {
    throw new Error('Sheet not found: API - Assets');
  }
  
  var data = sheet.getRange('B2:B').getValues(); // Get account names from column B
  var accounts = data.flat().filter(account => account); // Flatten and remove empty values
  return accounts;
}

function counterparty_getAccountTokens(accountName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  if (!sheet) {
    throw new Error('Sheet not found: API - Assets');
  }
  
  var data = sheet.getRange('B2:E').getValues(); // Get values from columns B to E
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === accountName) {
      Logger.log('Retrieved tokens for account: ' + accountName);
      return {
        clientAssertion: data[i][1], // Client Assertion is in column C
        refreshToken: data[i][2] // Refresh Token is in column D
      };
    }
  }
  
  throw new Error('Account not found: ' + accountName);
}

function counterparty_updateRefreshToken(accountName, newRefreshToken) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  var row = findAccountRow(accountName);
  
  sheet.getRange(row, 5).setValue(newRefreshToken); // Save the new Refresh Token in column E
  Logger.log('Refresh token updated for account: ' + accountName);
}

function counterparty_saveNewAccessToken(accountName, accessToken) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  if (!sheet) {
    throw new Error('Sheet not found: API - Assets');
  }

  var row = findAccountRow(accountName);
  sheet.getRange(row, 5).setValue(accessToken); // Save the new Access Token in column E
  Logger.log('Access token updated for account: ' + accountName);
}

function counterparty_addCounterparty(counterparty) {
  try {
    const accountName = counterparty.account;
    if (!accountName) {
      throw new Error('Account name is undefined or empty.');
    }

    // Refresh the token for the account
    const accessToken = counterparty_refreshAuthToken(accountName);
    if (!accessToken) {
      throw new Error('Failed to refresh access token.');
    }

    // Save new access token if needed
    counterparty_saveNewAccessToken(accountName, accessToken);

    const url = 'https://b2b.revolut.com/api/1.0/counterparty';

    const options = {
      method: 'POST',
      contentType: 'application/json',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      payload: JSON.stringify(counterparty),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    const jsonResponse = JSON.parse(responseBody);

    Logger.log('Response Code: ' + responseCode);
    Logger.log('Response Body: ' + responseBody);

    if (responseCode === 200 || responseCode === 201) {
      // 200 OK or 201 Created indicates success
      Logger.log('Counterparty added successfully:', jsonResponse);
      return { success: true, message: 'Counterparty added successfully', data: jsonResponse };
    } else {
      // For other response codes, treat as errors
      Logger.log('Counterparty Error Response:', jsonResponse);
      return { success: false, message: `Error ${responseCode}: ${jsonResponse.message || 'Unknown error'}` };
    }
  } catch (error) {
    Logger.log('Counterparty Request Error:', error.message);
    return { success: false, message: error.message };
  }
}

/////////////////////
function findAccountRow(accountName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  if (!sheet) {
    throw new Error('Sheet not found: API - Assets');
  }

  var data = sheet.getRange('B2:B').getValues(); // Account names are in column B
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === accountName) {
      return i + 2; // Row number (accounting for header row)
    }
  }
  throw new Error('Account not found: ' + accountName);
}
//////////////////////
function counterparty_refreshAuthToken(accountName) {
  if (!accountName) {
    throw new Error('Account name is undefined or empty.');
  }

  var tokenUrl = 'https://b2b.revolut.com/api/1.0/auth/token';

  // Get the tokens from the sheet
  var tokens = counterparty_getAccountTokens(accountName);
  var clientAssertionToken = tokens.clientAssertion;
  var refreshToken = tokens.refreshToken;

  Logger.log('Client Assertion Token: ' + clientAssertionToken);
  Logger.log('Refresh Token: ' + refreshToken);

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

    // Update the new refresh token in column E
    updateRefreshToken(accountName, responseBody.refresh_token);

    return responseBody.access_token; // Return the new access token
  } catch (e) {
    throw new Error('Failed to refresh token: ' + e.message);
  }
}

function updateRefreshToken(accountName, newRefreshToken) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  var row = findAccountRow(accountName);

  sheet.getRange(row, 5).setValue(newRefreshToken); // Column E is the 5th column
  Logger.log('Refresh token updated for account: ' + accountName);
}