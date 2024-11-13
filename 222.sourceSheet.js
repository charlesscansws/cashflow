// Import data based on user selection
function importData(formData) {
  try {
    // Log the received formData for debugging
    Logger.log('Received formData: %s', JSON.stringify(formData));

    var targetSheetName = formData.targetSheet;
    if (!targetSheetName) {
      throw new Error('Target sheet not specified.');
    }
    var targetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(targetSheetName);
    if (!targetSheet) {
      throw new Error('Target sheet "' + targetSheetName + '" does not exist.');
    }

    // Clear existing data in target columns B2:F (starting from row 2)
    targetSheet.getRange('B2:F').clearContent();

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Build a mapping of source columns to target columns
    var sourceToTargetMapping = [];
    var targetColumnsAssigned = [];
    for (var key in formData) {
      if (key.startsWith('columns-')) {
        var sheetName = key.substring(8);
        var columns = formData[key];
        if (!Array.isArray(columns)) {
          columns = [columns];
        }
        columns.forEach(function(column) {
          var targetColumnKey = 'targetColumn-' + sheetName + '-' + column;
          var targetColumn = formData[targetColumnKey];
          if (targetColumn) {
            if (targetColumnsAssigned.includes(targetColumn)) {
              throw new Error('Target column ' + targetColumn + ' is assigned multiple times.');
            }
            targetColumnsAssigned.push(targetColumn);
            sourceToTargetMapping.push({
              sourceSheetName: sheetName,
              sourceColumnName: column,
              targetColumnLetter: targetColumn
            });
          } else {
            throw new Error('No target column selected for "' + column + '" in sheet "' + sheetName + '".');
          }
        });
      }
    }

    // Log the mapping for debugging
    Logger.log('Source to Target Mapping: %s', JSON.stringify(sourceToTargetMapping));

    // Import data based on mapping
    sourceToTargetMapping.forEach(function(mapping) {
      var sourceSheet = ss.getSheetByName(mapping.sourceSheetName);
      if (!sourceSheet) {
        throw new Error('Source sheet "' + mapping.sourceSheetName + '" does not exist.');
      }
      var targetColumnIndex = columnLetterToIndex(mapping.targetColumnLetter);

      var sourceColumnIndex = getColumnIndexByName(sourceSheet, mapping.sourceColumnName);
      if (sourceColumnIndex !== -1) {
        var numRows = sourceSheet.getLastRow() - 1; // Exclude header row
        if (numRows >= 0) {
          // Copy header from source column (row 1)
          var header = sourceSheet.getRange(1, sourceColumnIndex + 1).getValue();
          targetSheet.getRange(2, targetColumnIndex + 1).setValue(header);

          if (numRows > 0) {
            // Copy data from source column starting from row 2 (exclude header)
            var data = sourceSheet.getRange(2, sourceColumnIndex + 1, numRows).getValues();
            targetSheet.getRange(3, targetColumnIndex + 1, data.length, 1).setValues(data);
          }
        }
      } else {
        throw new Error('Column "' + mapping.sourceColumnName + '" not found in sheet "' + mapping.sourceSheetName + '".');
      }
    });
  } catch (error) {
    throw new Error(error.message); // Pass the error message back to the client
  }
}

// Helper function to get column index by name
function getColumnIndexByName(sheet, columnName) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.indexOf(columnName);
}

// Helper function to get column index by letter (A=0)
function columnLetterToIndex(letter) {
  return letter.charCodeAt(0) - 'A'.charCodeAt(0);
}

// Get all sheet names
function getSheetNames() {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  return sheets.map(function(sheet) {
    return sheet.getName();
  });
}

// Get columns for a given sheet
function getSheetColumns(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var lastColumn = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  return headers.map(function(header, index) {
    return header || 'Column ' + (index + 1);
  });
}