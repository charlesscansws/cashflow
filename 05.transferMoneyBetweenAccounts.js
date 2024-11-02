// Main function to open the transfer modal dialog
function transferBetweenSubaccounts() {
  var htmlOutput = HtmlService.createHtmlOutputFromFile('MoveMoneyBetweenAccounts')
    .setWidth(1200)
    .setHeight(800)
    .setTitle('Move Money Between Revolut Sub-Accounts');

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Move Money Between Revolut Sub-Accounts');
}

// Function to fetch account data for the HTML form
function getAccountData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Accounts');
  var range = sheet.getRange('A2:I' + sheet.getLastRow());
  var data = range.getValues();

  return data.map(row => ({
    accountName: row[0],
    accountId: row[1],
    balance: row[3],
    currency: row[4]
  }));
}

// Function to perform the transfer based on user input
/**
 * Transfer money between Revolut accounts of the business.
 *
 * @param {string} accountName - The name of the account holder.
 * @param {string} fromAccountId - The ID of the account to transfer from.
 * @param {string} toAccountId - The ID of the account to transfer to.
 * @param {number} amount - The amount of money to transfer.
 * @param {string} currency - The currency of the transfer (e.g., "USD").
 * @param {string} reference - A reference note for the transfer.
 */
function transferMoneyBetweenAccounts(accountName, fromAccountId, toAccountId, amount, currency, reference) {
  var url = 'https://b2b.revolut.com/api/1.0';
  var tokens = getAccountTokens(accountName);

  if (!tokens) {
    throw new Error('No tokens found for account: ' + accountName);
  }

  var headers = {
    'Authorization': 'Bearer ' + tokens.clientAssertion,
    'Content-Type': 'application/json'
  };

  var payload = {
    request_id: Utilities.getUuid(), // Unique request ID
    source_account_id: fromAccountId, // Use correct parameter name
    target_account_id: toAccountId, // Use correct parameter name
    amount: amount,
    currency: currency,
    reference: reference
  };

  // Log the payload and headers
  Logger.log('Transfer Payload: ' + JSON.stringify(payload));
  Logger.log('Transfer Headers: ' + JSON.stringify(headers));

  var options = {
    'method': 'post',
    'headers': headers,
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true // Allow handling of HTTP errors
  };

  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();
  var responseBody = response.getContentText();

  // Log the initial response
  Logger.log('Initial Response Code: ' + responseCode);
  Logger.log('Initial Response Body: ' + responseBody);

  if (responseCode === 401) {
    // Handle token refresh if needed
    var newClientAssertion = refreshAuthToken(accountName);
    tokens.clientAssertion = newClientAssertion;
    updateAccountTokens(accountName, newClientAssertion, tokens.refreshToken);

    // Retry the request with the new token
    headers['Authorization'] = 'Bearer ' + newClientAssertion;
    options.headers = headers;
    response = UrlFetchApp.fetch(url, options);
    responseCode = response.getResponseCode();
    responseBody = response.getContentText();

    // Log retry responses for debugging
    Logger.log('Retry Response Code: ' + responseCode);
    Logger.log('Retry Response Body: ' + responseBody);

    if (responseCode !== 201) {
      throw new Error('API call failed after token refresh with response code: ' + responseCode);
    }
  } else if (responseCode !== 201) {
    throw new Error('API call failed with response code: ' + responseCode);
  }

  Logger.log('Transfer successful!');
}


