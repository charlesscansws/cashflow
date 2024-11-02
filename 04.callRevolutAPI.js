// Call Revolut API for a specific endpoint and account
function callRevolutAPI(endpoint, accountName) {
  var url = 'https://b2b.revolut.com/api/1.0/' + endpoint;
  var tokens = getAccountTokens(accountName);

  if (!tokens) {
    throw new Error('No tokens found for account: ' + accountName);
  }

  var headers = {
    'Authorization': 'Bearer ' + tokens.clientAssertion
  };

  var options = {
    'method': 'get',
    'headers': headers,
    'muteHttpExceptions': true // Allow us to handle HTTP errors
  };

  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();

  if (responseCode === 401) {
    // Handle token refresh if needed
    var newClientAssertion = refreshAuthToken(accountName); // Pass accountName
    tokens.clientAssertion = newClientAssertion;
    // Update the tokens in the sheet
    updateAccountTokens(accountName, newClientAssertion, tokens.refreshToken);

    // Retry the request with the new token
    headers['Authorization'] = 'Bearer ' + newClientAssertion;
    options.headers = headers;
    response = UrlFetchApp.fetch(url, options);
  } else if (responseCode !== 200) {
    throw new Error('API call failed with response code: ' + responseCode);
  }

  var responseBody = response.getContentText();
  Logger.log(responseBody); // Log the raw JSON response

  // Define the mapping of endpoints to sheet names
  var endpointToSheetMap = {
    'accounts': 'API - Accounts',
    'transactions': 'API - Transactions',
    'counterparties': 'API - Counterparties',
    'cards': 'API - List of Cards'
    // Add more endpoint mappings as needed
  };

  // Get the sheet name for the current endpoint
  var sheetName = endpointToSheetMap[endpoint] || endpoint; // Default to endpoint name if not found

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }

  // Parse and write response to sheet
  var jsonResponse = JSON.parse(responseBody);
  var values = jsonResponse || []; // Ensure values is an array

  if (values.length === 0) {
    Logger.log('No data to write to the sheet.');
    return; // Exit if there’s no data to write
  }

  // Determine data mapping based on endpoint
  var rows;
  switch (endpoint) {
    case 'accounts':
      rows = values.map(item => [
        accountName, // Add accountName in the first column
        item.id || '',
        item.name || '',
        item.balance || '',
        item.currency || '',
        item.state || '',
        item.public || '',
        item.created_at || '',
        item.updated_at || ''
      ]);
      break;


    case 'transactions':
      rows = [];
      values.forEach(item => {
        const baseInfo = [
          accountName,
          item.id || '',
          item.type || '',
          item.created_at || '',
          item.completed_at || '',
          item.updated_at || '',
          item.state || '',
          item.reference || '',
          item.request_id || '',
          (item.merchant && item.merchant.category_code) || '',
          (item.merchant && item.merchant.city) || '',
          (item.merchant && item.merchant.country) || '',
          (item.merchant && item.merchant.name) || '',
          item.revertable || '',
          (item.card && item.card.card_number) || ''
        ];

        // Process each leg separately to determine debit or credit
        item.legs.forEach((leg, index) => {
          const isDebit = (leg.amount < 0);  // Use amount sign to determine debit
          const legType = isDebit ? 'debit' : 'credit';  // Assign based on the sign
          const legInfo = [
            leg.leg_id || '',
            leg.account_id || '',
            legType,
            leg.amount || '',
            leg.currency || '',
            leg.balance || '',
            (leg.counterparty && leg.counterparty.account_id) || '',
            (leg.counterparty && leg.counterparty.account_type) || '',
            leg.description || ''
          ];

          rows.push([...baseInfo, ...legInfo]);
        });
      });
      break;

    // Handle multiple accounts per counterparty
    case 'counterparties':
      //Logger.log('Processing counterparties...');
      //Logger.log('Raw data: ' + JSON.stringify(values)); // Log the raw data

      // Handle multiple accounts per counterparty
      rows = values.flatMap(item => {
        //Logger.log('Counterparty: ' + JSON.stringify(item)); // Log each counterparty

      if (Array.isArray(item.accounts) && item.accounts.length > 0) {
          return item.accounts.map(account => [
              '', // Placeholder
              accountName,
              item.id || '',
              account.id || '',
              item.updated_at || '',
              item.name || '',
              item.revtag || '',
              account.account_no || '',
              account.sort_code || '',
              account.iban || '',
              account.bic || '',
              account.bank_country || '',
              account.currency || '',
              account.address ? account.address.city : '',
              account.address ? account.address.postcode : '',
              account.address ? account.address.country : ''
          ]);
      } else {
          return [
              [
                  '', // Placeholder
                  accountName,
                  item.id || '',
                  '', // No account.id
                  item.updated_at || '',
                  item.name || '',
                  item.revtag || '',
                  //item.state || '',
                  //item.created_at || '',
                  '', // Empty account fields
                  '',
                  '',
                  '',
                  '',
                  '',
                  '',
                  '',
                  '',
                  ''
              ]
          ];
      }
      });
      break;

    case 'cards':
      // Ensure values is an array, if not, convert it to one
      // https://developer.revolut.com/docs/business/get-cards> NEED SPECIAL REQUEST URL to read
      rows = (Array.isArray(values) ? values : [values]).map(item => [
        accountName, // Add accountName in the first column
        item.id || '',
        item.last_digits || '',
        item.expiry || '',
        item.state || '',
        item.label || '',
        item.virtual || '',
        (item.accounts && item.accounts.join(', ')) || '', // Assuming accounts is an array
        (item.categories && item.categories.join(', ')) || '', // Assuming categories is an array
        (item.spending_limits && item.spending_limits.join(', ')) || '', // Assuming spending_limits is an array
        item.holder_id || '',
        item.created_at || '',
        item.updated_at || ''
      ]);
      break;

    default:
      throw new Error('Unsupported endpoint: ' + endpoint);
  }

  // Find the last row in column B
  var lastRow = sheet.getRange("B1:B").getValues().filter(String).length;

  // Ensure that the data starts at row 2 if the sheet is empty
  lastRow = Math.max(lastRow, 1) + 1;

  // Calculate where to append the new data
  var numRows = rows.length;
  var numCols = rows[0].length;
  var dataRange = sheet.getRange(lastRow, 1, numRows, numCols); // Start from column 1 (A)

  // Write data to the sheet
  dataRange.setValues(rows);

  Logger.log(`Appending data to sheet ${sheetName} starting at row ${lastRow}`);

  // Remove duplicates
  removeDuplicateRows(sheet, lastRow, numRows);
}

