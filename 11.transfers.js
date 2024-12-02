function getFilteredCashFlowData() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cash Flow');
    if (!sheet) throw new Error('Sheet "Cash Flow" not found.');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const displayHeaders = ["From", "Paying Agent", "CCY", "Amount", "Reference", "Purpose", "Link"];
    const filterHeaders = ["To", "Status"];

    const displayIndices = displayHeaders.map(header => {
        const index = headers.indexOf(header);
        if (index === -1) throw new Error(`Missing column: ${header}`);
        return index;
    });

    const filterIndices = filterHeaders.map(header => {
        const index = headers.indexOf(header);
        if (index === -1) throw new Error(`Missing column: ${header}`);
        return index;
    });

    const rows = data.slice(1).map(row => ({
        display: displayIndices.map(index => row[index]),
        filters: filterIndices.map(index => row[index])
    }));

    return { headers: displayHeaders, rows };
}

function getSelectedPaymentDetails(selectedIndices) {
    try {
        const cashFlowSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cash Flow');
        const cashFlowData = cashFlowSheet.getDataRange().getValues();
        const headers = cashFlowData[0];

        const selectedPayments = selectedIndices.map(index => {
            const row = cashFlowData[index + 1]; // Adjust for header row
            return {
                fromAccountDetails: row[headers.indexOf('From')] || '',
                payingAgentDetails: row[headers.indexOf('Paying Agent')] || '',
                ccy: row[headers.indexOf('CCY')] || '',
                amount: row[headers.indexOf('Amount')] || '',
                reference: row[headers.indexOf('Reference')] || '',
            };
        });

        Logger.log(`Selected Payments: ${JSON.stringify(selectedPayments)}`);
        return selectedPayments;
    } catch (error) {
        Logger.log(`Error in getSelectedPaymentDetails: ${error.message}`);
        throw error;
    }
}

function executePayments(selectedIndices) {
    const cashFlowSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Cash Flow');
    const accountsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Accounts');
    const counterpartiesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Counterparties');

    if (!cashFlowSheet || !accountsSheet || !counterpartiesSheet) {
        throw new Error('Required sheet not found.');
    }

    const cashFlowData = cashFlowSheet.getDataRange().getValues();
    const headers = cashFlowData[0];

    const accountsData = accountsSheet.getDataRange().getValues();
    const counterpartiesData = counterpartiesSheet.getDataRange().getValues();

    return selectedIndices.map(index => {
        const row = cashFlowData[index + 1]; // Adjust for header row
        const fromAccount = counterpartiesData.find(item => item[3] === row[headers.indexOf('From')]);
        const payingAgent = accountsData.find(item => item[3] === row[headers.indexOf('Paying Agent')]);

        if (!fromAccount || !payingAgent) {
            Logger.log(`Missing details for row ${index + 1}`);
        }

        return {
            fromAccountDetails: fromAccount || {},
            payingAgentDetails: payingAgent || {},
            ccy: row[headers.indexOf('CCY')],
            amount: row[headers.indexOf('Amount')],
            reference: row[headers.indexOf('Reference')],
            purpose: row[headers.indexOf('Purpose')],
            link: row[headers.indexOf('Link')],
        };
    });
}

function submitPayments(payments) {
    const url = 'https://b2b.revolut.com/api/1.0/payment-drafts';
    const assetMap = getAssetMap(); // Get the asset map once

    const enrichedPayments = payments.map(payment => {
        const payingAgentDetails = payment.payingAgentDetails;
        if (!payingAgentDetails || !payingAgentDetails[3]) {
            throw new Error('Paying Agent is missing or invalid.');
        }

        const payingAgentName = payingAgentDetails[3]; // Use the relevant column for "Paying Agent"
        const assetDetails = assetMap[payingAgentName];

        if (!assetDetails) {
            throw new Error(`No matching account found for Paying Agent: ${payingAgentName}`);
        }

        const { clientAssertion, refreshToken } = assetDetails;
        if (!clientAssertion && !refreshToken) {
            throw new Error('Missing client assertion or refresh token.');
        }

        const token = getAuthToken(payingAgentName); // Use existing logic
        return { payment, token };
    });

    // Group payments by token
    const tokenGroups = enrichedPayments.reduce((groups, { payment, token }) => {
        if (!groups[token]) groups[token] = [];
        groups[token].push(payment);
        return groups;
    }, {});

    // Process each group of payments by token
    const results = Object.keys(tokenGroups).map(token => {
        const groupPayments = tokenGroups[token];
        const body = JSON.stringify({
            title: 'Batch Payment',
            schedule_for: new Date().toISOString().split('T')[0],
            payments: groupPayments.map(payment => ({
                account_id: payment.payingAgentDetails[1], // Use the Paying Agent's account ID
                receiver: {
                    counterparty_id: payment.fromAccountDetails[1], // Use the From Account's counterparty ID
                    account_id: payment.fromAccountDetails[2], // Use the From Account's account ID
                },
                amount: payment.amount,
                currency: payment.ccy,
                reference: payment.reference,
            })),
        });

        const options = {
            method: 'post',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            payload: body,
            muteHttpExceptions: true,
        };

        try {
            const response = UrlFetchApp.fetch(url, options);
            const responseCode = response.getResponseCode();

            if (responseCode !== 200) {
                throw new Error(`Failed to submit payments: ${response.getContentText()}`);
            }

            return JSON.parse(response.getContentText());
        } catch (error) {
            Logger.log(`Error submitting payments for token: ${token}. Error: ${error.message}`);
            throw error;
        }
    });

    return results;
}

///////////////////
/**
 * Create a map of account details from the 'API - Assets' sheet.
 * @returns {Object} A map with accountName as keys and token details as values.
 */
function getAssetMap() {
    const assetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('API - Assets');
    if (!assetSheet) {
        throw new Error('Sheet "API - Assets" not found.');
    }

    const assetData = assetSheet.getDataRange().getValues();
    const assetMap = assetData.reduce((map, row) => {
        const accountName = row[1]; // Column B: accountName
        const clientAssertion = row[2]; // Column C: clientAssertionToken
        const refreshToken = row[3]; // Column D: refreshToken

        if (accountName) {
            map[accountName] = { clientAssertion, refreshToken };
        }
        return map;
    }, {});

    Logger.log(`Asset Map: ${JSON.stringify(assetMap)}`);
    return assetMap;
}
