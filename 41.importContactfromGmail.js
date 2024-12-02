function importContactsFromEmails() {
  var Relation = "👤 Contact";
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var relationSheet = spreadsheet.getSheetByName(Relation);

  // Add headers to the sheet if it's empty
  if (relationSheet.getLastRow() == 0) {
    relationSheet.appendRow(["First Name", "Last Name", "Email"]);
  }

  // Get all threads in the inbox
  var threads = GmailApp.getInboxThreads();

  var existingEmails = new Set(
    relationSheet.getRange(2, 3, relationSheet.getLastRow(), 1).getValues().flat()
  ); // Get existing emails from Column F

  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();

    for (var j = 0; j < messages.length; j++) {
      var message = messages[j];

      // Get sender's email address
      var sender = message.getFrom();

      // Get sender's name
      var senderName = getSenderName(sender);

      // Extract email between "<" and ">"
      var emailMatch = sender.match(/<([^>]+)>/);
      var email = emailMatch ? emailMatch[1] : sender;

      // Check for uniqueness based on email before appending to the sheet
      if (!existingEmails.has(email)) {
        existingEmails.add(email);

        // Split sender's name into first and last name
        var names = senderName.split(" ");

        // Remove quotes and commas from first and last names
        var firstName = names[0] ? names[0].replace(/['"]/g, "") : "";
        var lastName = names.slice(1).join(" ") ? names.slice(1).join(" ").replace(/['"]/g, "") : "";

        // Append data to the last row of the sheet
        relationSheet.appendRow(["", "", "", firstName, lastName, email]);
      }
    }
  }

  Logger.log('Contacts imported successfully.');
}

function getSenderName(email) {
  // Retrieve the sender's name from the email address
  var nameMatch = email.match(/(.*) <.*>/);
  return nameMatch ? nameMatch[1] : email;
}
