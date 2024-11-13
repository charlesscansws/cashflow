// Retrieve token from 'API - Assets' sheet based on accountName

let cachedTokens = {};

function getAuthToken(accountName) {
  const now = new Date();
  if (cachedTokens[accountName] && cachedTokens[accountName].expiration > now) {
    // Return cached token if it's still valid
    return cachedTokens[accountName].token;
  } else {
    // Refresh token and update cache
    const newToken = refreshAuthToken(accountName);
    const expiration = new Date(now.getTime() + 3600 * 1000); // Assuming token validity for 1 hour
    cachedTokens[accountName] = {
      token: newToken,
      expiration: expiration
    };
    return newToken;
  }
}

function refreshAuthToken(accountName) {
  if (!accountName) throw new Error('Account name is undefined or empty.');
  const tokenUrl = 'https://b2b.revolut.com/api/1.0/auth/token';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  const data = sheet.getRange('B2:D').getValues();

  let clientAssertionToken = '';
  let refreshToken = '';

  // Search for account and retrieve tokens
  for (let i = 0; i < data.length; i++) {
    if ((data[i][0] || '').trim() === accountName.trim()) {
      clientAssertionToken = data[i][1]; // Column C
      refreshToken = data[i][2];         // Column D
      break;
    }
  }
  if (!clientAssertionToken || !refreshToken) throw new Error('Missing client assertion or refresh token.');

  const payload = {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: clientAssertionToken
  };

  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: Object.keys(payload).map(key => encodeURIComponent(key) + '=' + encodeURIComponent(payload[key])).join('&'),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(tokenUrl, options);
  const responseCode = response.getResponseCode();
  const responseBody = JSON.parse(response.getContentText());

  if (responseCode !== 200) {
    throw new Error('Failed to refresh token: ' + (responseBody.error_description || 'unknown error'));
  }

  // Update the refresh token in the spreadsheet
  updateRefreshToken(accountName, responseBody.refresh_token);

  return responseBody.access_token;
}

function isTokenExpired(expirationTime) {
  const now = new Date();
  return now >= expirationTime;
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
function Xcounterparty_refreshAuthToken(accountName) {
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
    counterparty_updateRefreshToken(accountName, responseBody.refresh_token);
    
    return responseBody.access_token; // Return the new access token
  } catch (e) {
    throw new Error('Failed to refresh token: ' + e.message);
  }
}
//////////////////