// Retrieve token from 'API - Assets' sheet based on accountName
let cachedToken = null;
let tokenExpiration = null;

function getAuthToken(accountName) {
  const now = new Date();

  // Check if we have a cached token and it’s still valid
  if (cachedToken && tokenExpiration && now < tokenExpiration) {
    return cachedToken;
  }

  // Otherwise, refresh the token
  const newToken = refreshAuthToken(accountName);
  if (newToken) {
    cachedToken = newToken;
    tokenExpiration = new Date(now.getTime() + 3600 * 1000); // Token valid for 1 hour
    return cachedToken;
  } else {
    throw new Error('Failed to refresh token');
  }
}

// Refresh token using clientAssertion and current refreshToken
function refreshAuthToken(accountName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  const range = sheet.getRange('B2:E'); // Adjust to match the actual range
  const data = range.getValues();

  // Find the row with the account name
  const row = data.find(row => row[0] === accountName);
  if (!row) {
    throw new Error(`Account ${accountName} not found`);
  }

  const clientAssertion = row[1];
  const refreshToken = row[2];

  // Construct your refresh token request
  const url = 'https://b2b.revolut.com/api/1.0/auth/token'; // Adjust URL if necessary
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
  const status = response.getResponseCode();
  if (status === 200) {
    const json = JSON.parse(response.getContentText());
    const newAccessToken = json.access_token;

    // Update the sheet with the new token
    sheet.getRange(rowIndex + 1, 5).setValue(json.refresh_token); // Column E for updated refresh token if needed
    return newAccessToken;
  } else {
    Logger.log(`Token refresh failed: ${response.getContentText()}`);
    return null;
  }
}




///////////


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
