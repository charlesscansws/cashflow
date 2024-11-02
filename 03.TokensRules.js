// Retrieve token from 'API - Assets' sheet based on accountName
let cachedToken = null;
let tokenExpiration = null;

function getAuthToken(accountName) {
  const now = new Date();

  if (cachedToken && tokenExpiration && now < tokenExpiration) {
    return cachedToken;
  }

  const newToken = refreshAuthToken(accountName);
  if (newToken) {
    cachedToken = newToken;
    tokenExpiration = new Date(now.getTime() + 3600 * 1000);
    return cachedToken;
  } else {
    throw new Error('Failed to refresh token');
  }
}

function refreshAuthToken(accountName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  const data = sheet.getRange('B2:E').getValues();
  const accountRow = data.find(row => row[0] === accountName);

  if (!accountRow) {
    throw new Error(`Account ${accountName} not found`);
  }

  const clientAssertion = accountRow[1];
  const refreshToken = accountRow[2];

  const url = 'https://b2b.revolut.com/api/1.0/auth/token';
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      grant_type: 'refresh_token',
      client_assertion: clientAssertion,
      refresh_token: refreshToken
    }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() === 200) {
    const json = JSON.parse(response.getContentText());
    sheet.getRange(accountRow[3], 5).setValue(json.refresh_token);
    return json.access_token;
  } else {
    Logger.log(`Token refresh failed: ${response.getContentText()}`);
    return null;
  }
}

// Check if token is expired (customize based on expiration criteria)
function isTokenExpired(token) {
  // Implement logic to check if the token has expired
  return false; // Replace with actual expiration logic
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


