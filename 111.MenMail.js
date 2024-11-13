/**
 * CODE.GS FILE
 */
function sendtoEmail(data) {
  var userEmail = Session.getActiveUser().getEmail();
  var message = 'Completed: Email sent to ' + userEmail;
  
  try {
    var tableHTML = generateHTMLTable(); // Fetch table HTML
    var emailContent = data.html + "<br>" + tableHTML; // Combine editor content and table

    MailApp.sendEmail(userEmail, data.n, 'html', {
      htmlBody: emailContent
    });
  } catch (e) {
    Logger.log(e.toString());
  }

  return { rep: message, id: data.id };
}

function makePDF(data) {     
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var folderSheet = spreadsheet.getSheetByName("Folder - Assets");

  // Retrieve and validate the folder ID from cell F3
  var folderIdCell = folderSheet.getRange('L3').getValue().trim();
  if (!folderIdCell) {
    return {
      warning: true,
      message: 'Warning: Folder ID in F3 is empty. Please specify a folder ID to proceed.'
    };
  }

  var tableHTML = generateHTMLTable(); // Fetch table HTML
  var pdfContent = data.html + "<br>" + tableHTML; // Combine editor content and table

  var blob = Utilities.newBlob(pdfContent, "text/html", getRandom() + ".html");
  var pdf = blob.getAs("application/pdf");

  var folder = DriveApp.getFolderById(folderIdCell);
  var file = folder.createFile(pdf).setName(data.n + '.pdf');

  var message = 'Completed: PDF ready at <br><input style="width:100%;" onClick="this.select();" value="' + file.getUrl() + '">';
  
  return { url: file.getUrl(), rep: message, id: data.id };
}


function getContent(id) {
  Logger.log(id);
  var content = false;
  if (id) {
    content = DriveApp.getFileById(id).getBlob().getDataAsString();
  }
  return content;
}
 
function XgetHTMLFile() {
  const folderSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Folders");
  const folderId = folderSheet.getRange('L2').getValue();
  let fileList = [];
  let warningMessage = "";

  // Check if folder ID exists in cell L2
  if (!folderId) {
    warningMessage = "Warning! There is no folder set up. Please add your folder ID to the sheet 'Folders', cell L2.";
  } else {
    const files = DriveApp.getFolderById(folderId).getFiles();
    while (files.hasNext()) {
      const file = files.next();
      fileList.push({
        id: file.getId(),
        name: file.getName()
      });
    }
    // Check if folder is empty
    if (fileList.length === 0) {
      warningMessage = "Warning: There is no folder set up. Please add your folder ID to the sheet 'Folders', cell L2.";
    }
  }

  // Render HTML with warning message or file list
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <!-- Bootstrap CSS -->
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
      <style>
        /* Center modal */
        #modal {
          display: flex;
          align-items: center;
          justify-content: center;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }
        #modalContent {
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 400px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div id="modal">
        <div id="modalContent" class="modal-content p-4">
          ${warningMessage ? `<div class="alert alert-warning">${warningMessage}</div>` : `
            <p class="mb-3">Select a file:</p>
            <select id="fileSelect" class="form-control mb-3">
              ${fileList.map(file => `<option value="${file.id}">${file.name}</option>`).join("")}
            </select>
          `}
          <button id="closeButton" class="btn btn-primary mt-3">Close</button>
        </div>
      </div>
      <script>
        document.getElementById("closeButton").addEventListener("click", function() {
          google.script.host.close();
        });
      </script>
    </body>
    </html>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(400)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'File Selection');
}

function getHTMLFile() {
  const folderSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Folder - Assets");
  const folderId = folderSheet.getRange('L2').getValue();
  let fileList = [];
  
  // Check if folder ID exists in cell F2
  if (!folderId) {
    // Render HTML warning if F2 is empty
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <!-- Bootstrap CSS -->
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
        <style>
          #modal {
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
          }
          #modalContent {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            width: 100%;
            max-width: 400px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div id="modal">
          <div id="modalContent" class="modal-content p-4">
            <div class="alert alert-warning">Warning! There is no folder set up. Please add your folder ID to the sheet 'Folder - Assets', cell L2.</div>
            <button id="closeButton" class="btn btn-primary mt-3">Close</button>
          </div>
        </div>
        <script>
          document.getElementById("closeButton").addEventListener("click", function() {
            google.script.host.close();
          });
        </script>
      </body>
      </html>
    `;
    const htmlOutput = HtmlService.createHtmlOutput(htmlContent)
      .setWidth(400)
      .setHeight(300);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Folder Warning');
    return;
  } 

  // If folder ID exists, retrieve files
  const files = DriveApp.getFolderById(folderId).getFiles();
  while (files.hasNext()) {
    const file = files.next();
    fileList.push({
      id: file.getId(),
      name: file.getName()
    });
  }

  // If folder is not empty, return the list directly
  Logger.log("Files found: " + JSON.stringify(fileList));
  return fileList;
}
 
function updateHTML(data) {
  Logger.log(data.id);
  var newFile = [];
  var message;
  if (data.id != '') {
    message = 'Updated file ' + data.n;
    newFile.file = DriveApp.getFileById(data.id);
    newFile.file.setName(data.n);
    newFile.file.setContent(data.html);
  }
  else {
    var id = '1ksZhcgwwhyAlPDmmrGzYJA0tDkNtSLR1';
    newFile.folder = DriveApp.getFolderById(id);
    newFile.file = newFile.folder.createFile(getRandom(), data.html);
    data.id = newFile.file.getId();
    newFile.file.setName(data.n);
    message = 'Made new file ' + data.n;
  }
  return {
    html: data.html
    , rep: message
    , id: data.id
  }
}
 
function getRandom() {
  return (new Date().getTime()).toString(36);
}
 
function fileExist(val) {
  var found = false;
  var files = DriveApp.getFolderById('1DyzDL6ZXgG_Msa1A7yKik11Z86P8D2Qu').searchFiles('title contains "' + val + '"');
  while (files.hasNext()) {
    var file = files.next();
    found = {
      name: file.getName()
      , id: file.getId()
    };
  }
  return found;
}

function doGet(e) {
  var data = {};
  data.message = "Hello World 4";  // Test message

  // Fetch HTML file data
  try {
    var files = getHTMLFile(); 
    if (files.length > 0) {
      data.files = files;  // Attach files to the data object
    } else {
      data.files = [];  // Set as empty array if no files are found
    }
  } catch (error) {
    Logger.log("Error fetching files: " + error.toString());
    data.files = [];
  }

  // Handle the case where an ID parameter is provided
  if (e && e.parameters && 'id' in e.parameters) {
    var q = e.parameters['id'][0];
    var check = fileExist(q);
    if (check) {
      data.id = check.id;
      data.name = check.name;
      data.html = getContent(check.id);
    }
  } else {
    data.id = '';
    data.html = '';
  }

  Logger.log("Files: " + JSON.stringify(data.files));
  Logger.log("Selected ID: " + data.id);

  // Pass the data object to the template
  var temp = HtmlService.createTemplateFromFile('EditorPopup');
  temp.data = data;
  var html = temp.evaluate();
  return html;
}

/////////////////
function generateFilteredHTMLTable() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Get all the data from A3:F (starting from row 3)
  var lastRow = sheet.getLastRow();
  var dataRange = sheet.getRange(3, 1, lastRow - 2, 6); // Range from A3:F
  var data = dataRange.getValues();

  // Filter rows based on checkbox (Column A should be true)
  var filteredDataRows = data.filter(function(row) {
    return row[0] === true; // Include only checked rows (where Column A is true)
  });

  // Headers from B2:F2
  var headerRange = sheet.getRange(2, 2, 1, 5); // B2:F2 for headers
  var headers = headerRange.getValues()[0];

  // Hidden column flags from B1:F1
  var hiddenColumns = sheet.getRange(1, 2, 1, 5).getValues()[0]; // B1:F1 for hidden columns

  var columnsToInclude = [];

  // Identify which columns should be included based on B1:F1 (hidden columns)
  for (var i = 0; i < hiddenColumns.length; i++) {
    if (!hiddenColumns[i].includes("❌") && !hiddenColumns[i].includes("👻")) {
      columnsToInclude.push(i);
    }
  }

  // Start building the HTML table
  var htmlTable = "<table border='1' cellspacing='0' cellpadding='5'>";

  // Add the table headers
  htmlTable += "<thead><tr>";
  for (var i = 0; i < columnsToInclude.length; i++) {
    var columnIndex = columnsToInclude[i];
    htmlTable += "<th>" + headers[columnIndex] + "</th>";
  }
  htmlTable += "</tr></thead><tbody>";

  // Add the filtered data rows to the table
  for (var j = 0; j < filteredDataRows.length; j++) {
    htmlTable += "<tr>";
    for (var k = 0; k < columnsToInclude.length; k++) {
      var columnIndex = columnsToInclude[k] + 1; // Add 1 because we skipped column A
      var cellValue = formatCell(filteredDataRows[j][columnIndex]);
      htmlTable += "<td>" + cellValue + "</td>";
    }
    htmlTable += "</tr>";
  }

  htmlTable += "</tbody></table>";

  console.log("Generated HTML Table in Apps Script:", htmlTable); // Check the generated table here
  return htmlTable; // Return HTML directly
}

function formatCell(value) {
  if (typeof value === 'string') {
    value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    value = value.replace(/\n/g, '<br>');
  } else if (value instanceof Date) {
    value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }
  return value;
}

function getActiveSpreadsheetDetails() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();

  var details = {
    spreadsheetId: spreadsheet.getId(),
    sheetName: sheet.getName()
  };

  return details;
}

function createEmailDraft(emailBody, fileName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Replace the placeholders with values from the spreadsheet
  var date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "YYYYMMdd-HHmmssmmm");
  emailBody = emailBody.replace("{{UNIQUEID}}", "[EMAIL - " + date + "]");
  var subject = sheet.getRange("Z3").getValue(); // Use subject from cell Z3

  // Get recipient email addresses
  var recipientTo = sheet.getRange("P1").getValue(); // Use email from cell P1
  var recipientCc = sheet.getRange("R1").getValue(); // Use email from cell R1
  var recipientBcc = sheet.getRange("T1").getValue(); // Use email from cell T1

  // Attach files based on checkboxes in "🧷 Attachment" sheet
  var attachmentDataRange = sheet.getRange("H3:M");
  var attachmentDataRows = attachmentDataRange.getValues();
  var attachments = [];

  // Define allowed MIME types
  var allowedMimeTypes = [
    "application/pdf", "image/jpeg", "image/jpg", "image/png", "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain",
    "text/html", "application/vnd.google-apps.spreadsheet", "application/vnd.google-apps.document",
    "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.google-apps.presentation", "text/csv"
  ];

  // Add files to attachments based on checkbox status
  for (var i = 0; i < attachmentDataRows.length; i++) {
    if (attachmentDataRows[i][0] === true) { // Check if checkbox is checked in column A
      var fileId = attachmentDataRows[i][4]; // Get the file ID from column E
      var file = DriveApp.getFileById(fileId);
      var mimeType = file.getMimeType();
      if (allowedMimeTypes.includes(mimeType)) {
        attachments.push(file.getBlob());
      }
    }
  }

  // Draft email options with To, CC, BCC, HTML content, and attachments
  var draftOptions = {
    to: recipientTo,
    cc: recipientCc,
    bcc: recipientBcc,
    htmlBody: emailBody,
    attachments: attachments
  };

  // Create the draft email using GmailApp
  GmailApp.createDraft(recipientTo, subject, "", draftOptions);

  return `Draft email created successfully for ${recipientTo}`;
}

// Function to get the active user email and aliases
function getUserEmails() {
  const userEmail = Session.getActiveUser().getEmail();
  const aliases = GmailApp.getAliases();
  const emails = [userEmail, ...aliases];
  return emails;
}

// Function to get default email field values from the spreadsheet
function getDefaultEmailFields() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  return {
    fromEmail: sheet.getRange("Z4").getValue(),
    toEmail: sheet.getRange("Z6").getValue(),
    ccEmail: sheet.getRange("Z7").getValue(),
    bccEmail: sheet.getRange("Z8").getValue(),
    emailSubject: sheet.getRange("Z9").getValue()
  };
}

function generateAndSetUniqueId() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmssSSS");
  const uniqueId = "[EMAIL - " + date + "]";
  
  sheet.getRange("Z3").setValue(uniqueId);  // Update cell Z3 with the unique ID
  return uniqueId;  // Return the unique ID so it can be used in further replacements
}