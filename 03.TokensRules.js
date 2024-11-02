// Retrieve token from 'API - Assets' sheet based on accountName
function getAuthToken(accountName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
  const data = sheet.getRange("B2:E").getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === accountName) { // Account name is in column B
      const clientAssertion = data[i][1];
      let refreshToken = data[i][2];
      let newRefreshToken = data[i][3];
      
      // Check if token needs refreshing
      if (isTokenExpired(refreshToken)) {
        // Refresh the token and update the sheet
        const newTokenData = refreshAuthToken(clientAssertion, refreshToken);
        refreshToken = newTokenData.refreshToken;
        newRefreshToken = newTokenData.newRefreshToken;

        // Update the tokens in 'API - Assets'
        sheet.getRange(`D${i + 2}`).setValue(refreshToken);
        sheet.getRange(`E${i + 2}`).setValue(newRefreshToken);
      }

      return refreshToken; // Return the valid token
    }
  }
  throw new Error(`Account name ${accountName} not found in API - Assets`);
}

// Refresh token using clientAssertion and current refreshToken
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
      clientAssertionToken = data[i][1];
      refreshToken = data[i][2];
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

  if (responseCode !== 200) throw new Error('Failed to refresh token: ' + (responseBody.error || 'unknown error'));

  return responseBody.access_token;
}

let cachedToken = null;
let tokenExpiration = null;

function getAuthToken(accountName) {
  const now = new Date();

  if (cachedToken && tokenExpiration && now < tokenExpiration) {
    return cachedToken;
  } else {
    const newToken = refreshAuthToken(accountName);
    cachedToken = newToken;
    tokenExpiration = new Date(now.getTime() + 3600 * 1000); // Assuming token validity for 1 hour
    return cachedToken;
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
